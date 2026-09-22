import {
  Injectable, NotFoundException, BadRequestException, Logger, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import MercadoPago, { PreApproval, Payment } from 'mercadopago';
import { Plan } from '@billing/entities/plan.entity';
import { Subscription } from '@billing/entities/subscription.entity';
import { BillingHistory, PaymentStatus } from '@billing/entities/billing-history.entity';
import { PendingSubscription, PendingSubscriptionStatus } from '@billing/entities/pending-subscription.entity';
import { Tenant, TenantStatus } from '@tenants/entities/tenant.entity';
import { User } from '@tenants/entities/user.entity';
import { CreateCheckoutDto, ConfirmTransferDto } from './dto/checkout.dto';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { MailService } from '@common/services/mail.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { PromotionService } from './promotion.service';
import { BillingService } from './billing.service';
import { SubscriptionStatus } from './entities/subscription.entity';
@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private readonly mp: MercadoPago;
  private readonly isSandbox: boolean;
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(PendingSubscription)
    private readonly pendingRepo: Repository<PendingSubscription>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(BillingHistory)
    private readonly billingRepo: Repository<BillingHistory>,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    private readonly systemSettings: SystemSettingsService,
    private readonly promotionService: PromotionService,
    private readonly billingService: BillingService,
  ) {
    const accessToken = this.config.get<string>('MP_ACCESS_TOKEN') ?? '';
    this.isSandbox = accessToken.startsWith('TEST-');
    this.mp = new MercadoPago({ accessToken });
    this.logger.log(`MercadoPago modo: ${this.isSandbox ? 'SANDBOX (testing)' : 'PRODUCCION'}`);
  }
  // ==========================================
  // PLANES PUBLICOS
  // ==========================================
  async getPublicPlans(): Promise<Plan[]> {
    return this.planRepo.find({ where: { is_active: true }, order: { price_monthly: 'ASC' } });
  }
  // ==========================================
  // INICIAR CHECKOUT
  // ==========================================
  async createCheckout(dto: CreateCheckoutDto): Promise<any> {
    const plan = await this.planRepo.findOne({ where: { id: dto.plan_id, is_active: true } });
    if (!plan) throw new NotFoundException('Plan no encontrado o inactivo');
    const existingUser = await this.userRepo.findOne({ where: { email: dto.owner_email } });
    if (existingUser) throw new ConflictException('Ya existe una cuenta con ese email. Por favor inicia sesion.');
    const existingPending = await this.pendingRepo.findOne({
      where: { owner_email: dto.owner_email, status: PendingSubscriptionStatus.PENDING },
    });
    if (existingPending) {
      existingPending.status = PendingSubscriptionStatus.REJECTED;
      await this.pendingRepo.save(existingPending);
    }

    // Detectar promoción vigente
    const promo = await this.promotionService.findActiveForPlan(dto.plan_id);
    let finalPrice = Number(plan.price_monthly);
    if (promo) {
      finalPrice = this.promotionService.calculatePromoPrice(Number(plan.price_monthly), promo);
      this.logger.log(`Promo "${promo.name}" aplicada: $${plan.price_monthly} -> $${finalPrice}`);
    }

    // Calcular prorrateo día 10
    const { prorated_amount } = this.billingService.calculateProration(finalPrice, new Date());

    // Solo el plan gratuito puede activarse sin un pago confirmado. El cliente
    // nunca puede convertir un plan pago en una prueba enviando `trial`.
    if (dto.payment_method === 'trial' && Number(plan.price_monthly) > 0) {
      throw new BadRequestException('El período de prueba solo está disponible para el plan gratuito');
    }

    const temp_password_hash = await bcrypt.hash(dto.password, 12);
    const pending = this.pendingRepo.create({
      plan_id: dto.plan_id,
      amount: prorated_amount, // Primer cobro = prorrateo
      business_name: dto.business_name,
      owner_email: dto.owner_email,
      owner_name: dto.owner_name,
      owner_phone: dto.owner_phone,
      tax_id: dto.tax_id,
      temp_password_hash,
      payment_method: dto.payment_method,
      status: PendingSubscriptionStatus.PENDING,
      referred_by_code: dto.referred_by_code,
    });
    const savedPending = await this.pendingRepo.save(pending);


    // Plan gratuito -> activar directo
    if (Number(plan.price_monthly) === 0) {
      savedPending.status = PendingSubscriptionStatus.APPROVED;
      await this.pendingRepo.save(savedPending);
      await this.activateAccount(savedPending, dto.payment_method, promo);
      await this.mailService.sendWelcomeEmail(savedPending.owner_email, savedPending.business_name);
      return { pending_id: savedPending.id, payment_method: dto.payment_method, is_free: Number(plan.price_monthly) === 0 || dto.payment_method === 'trial' };
    }
    if (dto.payment_method === 'mercadopago') {
      return this.createMercadoPagoSubscription(savedPending, plan, promo);
    }
    return this.createTransferInstructions(savedPending);
  }
  // ─── MercadoPago: suscripcion recurrente mensual ──────────────────────────
  private async createMercadoPagoSubscription(pending: PendingSubscription, plan: Plan, promo?: any): Promise<any> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const preApprovalClient = new PreApproval(this.mp);

    // Precio a cobrar: si hay promo, usar precio promocional
    let chargeAmount = Number(pending.amount); // Ya tiene prorrateo calculado
    // Para la suscripción recurrente de MP, usar el precio mensual (no prorrateo)
    let recurringAmount = Number(plan.price_monthly);
    if (promo) {
      recurringAmount = this.promotionService.calculatePromoPrice(Number(plan.price_monthly), promo);
    }

    const preApproval = await preApprovalClient.create({
      body: {
        reason: `Kioskos & Despenzas - Plan ${plan.name} (mensual automatico)${promo ? ` [Promo: ${promo.name}]` : ''}`,
        external_reference: pending.id,
        payer_email: pending.owner_email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: recurringAmount,
          currency_id: 'ARS',
        },
        back_url: `${frontendUrl}/checkout/success?pending=${pending.id}`,
        status: 'pending',
      } as any,
    });
    pending.mp_preference_id = preApproval.id ?? '';
    pending.mp_init_point = preApproval.init_point ?? '';
    await this.pendingRepo.save(pending);
    this.logger.log(`Suscripcion MP creada: ${preApproval.id} para ${pending.owner_email} ($${recurringAmount}/mes)`);
    return {
      pending_id: pending.id,
      payment_method: 'mercadopago',
      mp_init_point: preApproval.init_point ?? '',
      sandbox: this.isSandbox,
      promo_applied: promo ? { name: promo.name, price: recurringAmount } : null,
    };
  }
  private async createTransferInstructions(pending: PendingSubscription): Promise<any> {
    const alias = this.config.get<string>('TRANSFER_ALIAS') ?? 'kioskos.despenzas';
    const cbu = this.config.get<string>('TRANSFER_CBU') ?? '0000000000000000000000';
    const instructions = {
      pending_id: pending.id,
      payment_method: 'transfer',
      transfer_data: {
        alias,
        cbu,
        amount: Number(pending.amount),
        reference: `KD-${pending.id.split('-')[0].toUpperCase()}`,
      },
    };
    await this.mailService.sendTransferInstructions(pending.owner_email, pending.business_name, Number(pending.amount), `KD-${pending.id.split('-')[0].toUpperCase()}`);
    return instructions;
  }
  // ==========================================
  // WEBHOOK DE MERCADOPAGO
  // ==========================================
  async handleMercadoPagoWebhook(body: any): Promise<void> {
    const eventType = body?.type;
    const resourceId = body?.data?.id;
    this.logger.log(`MP Webhook: type=${eventType}, id=${resourceId}`);
    if (eventType === 'preapproval') {
      await this.handlePreApprovalWebhook(resourceId);
      return;
    }
    if (eventType === 'payment') {
      await this.handlePaymentWebhook(resourceId);
      return;
    }
    this.logger.debug(`Webhook tipo '${eventType}' ignorado`);
  }
  private async handlePreApprovalWebhook(preApprovalId: string): Promise<void> {
    if (!preApprovalId) return;
    try {
      const preApprovalClient = new PreApproval(this.mp);
      const preApproval = await preApprovalClient.get({ id: preApprovalId });
      if (preApproval.status !== 'authorized') return;
      const pendingId = preApproval.external_reference;
      if (!pendingId) return;
      const pending = await this.pendingRepo.findOne({ where: { id: pendingId as string } });
      if (!pending || pending.status === PendingSubscriptionStatus.APPROVED) return;
      pending.mp_payment_id = preApprovalId;
      pending.status = PendingSubscriptionStatus.APPROVED;
      await this.pendingRepo.save(pending);
      await this.activateAccount(pending, 'mercadopago');
      await this.mailService.sendWelcomeEmail(pending.owner_email, pending.business_name);
      this.logger.log(`Suscripcion autorizada -> cuenta activada: ${pending.owner_email}`);
    } catch (err) {
      this.logger.error('Error procesando webhook preapproval:', err);
    }
  }
  private async handlePaymentWebhook(paymentId: string): Promise<void> {
    if (!paymentId) return;
    try {
      const paymentClient = new Payment(this.mp);
      const payment = await paymentClient.get({ id: paymentId as any });
      if (payment.status !== 'approved') return;
      const pendingId = payment.external_reference;
      if (!pendingId) return;
      const pending = await this.pendingRepo.findOne({ where: { id: pendingId as string } });
      if (!pending || !pending.tenant_id) return;
      const subscription = await this.subscriptionRepo.findOne({
        where: { tenant_id: pending.tenant_id },
        order: { end_date: 'DESC' },
      });
      if (!subscription) return;
      const newEnd = new Date(subscription.end_date);
      newEnd.setMonth(newEnd.getMonth() + 1);
      subscription.end_date = newEnd;
      subscription.last_payment_date = new Date();
      subscription.next_billing_date = newEnd;
      await this.subscriptionRepo.save(subscription);
      await this.billingRepo.save(this.billingRepo.create({
        tenant_id: pending.tenant_id,
        amount: pending.amount,
        payment_status: PaymentStatus.PAID,
        payment_method: 'mercadopago',
        invoice_url: String(paymentId),
      }));
      this.logger.log(`Renovacion mensual procesada para tenant: ${pending.tenant_id}`);
    } catch (err) {
      this.logger.error('Error procesando webhook payment recurrente:', err);
    }
  }
  // ==========================================
  // CONFIRMAR TRANSFERENCIA MANUAL
  // ==========================================
  async confirmTransfer(dto: ConfirmTransferDto): Promise<{ message: string }> {
    const pending = await this.pendingRepo.findOne({ where: { id: dto.pending_id } });
    if (!pending) throw new NotFoundException('Solicitud no encontrada');
    if (pending.status !== PendingSubscriptionStatus.PENDING) {
      throw new BadRequestException('Esta solicitud ya fue procesada o expiro');
    }
    pending.transfer_alias = dto.transfer_alias;
    pending.transfer_notes = dto.transfer_notes ?? '';
    pending.status = PendingSubscriptionStatus.MANUAL_PENDING;
    await this.pendingRepo.save(pending);
    this.notificationsGateway.sendPendingPaymentAlert({
      pendingId: pending.id,
      businessName: pending.business_name,
      ownerEmail: pending.owner_email,
      paymentMethod: pending.payment_method,
      amount: Number(pending.amount),
    });
    this.logger.log(`Transferencia manual notificada: ${pending.owner_email} -> ${dto.transfer_alias}`);
    return { message: 'Tu solicitud fue recibida. Verificaremos la transferencia y activaremos tu cuenta en las proximas horas habiles.' };
  }
  // ==========================================
  // ESTADO (polling)
  // ==========================================
  async getCheckoutStatus(pendingId: string): Promise<any> {
    const pending = await this.pendingRepo.findOne({ where: { id: pendingId } });
    if (!pending) throw new NotFoundException('Solicitud no encontrada');
    return {
      status: pending.status,
      email: pending.owner_email,
      business_name: pending.business_name,
      is_free: pending.payment_method === 'free',
    };
  }
  // ==========================================
  // ACTIVAR CUENTA
  // ==========================================
  async activateAccount(pending: PendingSubscription, paymentMethod: string, promo?: any): Promise<void> {
    const existingUser = await this.userRepo.findOne({ where: { email: pending.owner_email } });
    if (existingUser) {
      this.logger.warn(`Usuario ${pending.owner_email} ya existe, no se duplica`);
      return;
    }
    const referral_code = Math.random().toString(36).substring(2, 10).toUpperCase();

    let referred_by_id: string | undefined;
    if (pending.referred_by_code) {
      const referrer = await this.tenantRepo.findOne({ where: { referral_code: pending.referred_by_code } });
      if (referrer) referred_by_id = referrer.id;
    }

    const trialDays = await this.systemSettings.getSetting('trial_days');
    const trial_ends_at = new Date();
    trial_ends_at.setDate(trial_ends_at.getDate() + (Number(trialDays) || 3));

    const tenant = this.tenantRepo.create({
      business_name: pending.business_name,
      owner_email: pending.owner_email,
      tax_id: pending.tax_id ?? undefined,
      phone: pending.owner_phone ?? undefined,
      status: paymentMethod === 'trial' ? TenantStatus.TRIAL : TenantStatus.ACTIVE,
      referral_code,
      referred_by_id,
      trial_ends_at,
    });
    const savedTenant = await this.tenantRepo.save(tenant);
    await this.userRepo.save(this.userRepo.create({
      tenant_id: savedTenant.id,
      name: pending.owner_name,
      email: pending.owner_email,
      password_hash: pending.temp_password_hash,
      role: 'admin',
      is_active: true,
    }));

    // Calcular precio y prorrateo con día 10
    const plan = await this.planRepo.findOne({ where: { id: pending.plan_id } });
    const fullPrice = Number(plan?.price_monthly || 0);
    let lockedPrice = fullPrice;
    let promoId: string | undefined;
    let priceAfterPromo: number | undefined;
    let promoEndsAt: Date | undefined;

    if (promo) {
      lockedPrice = this.promotionService.calculatePromoPrice(fullPrice, promo);
      promoId = promo.id;
      priceAfterPromo = fullPrice; // Precio normal después de la promo
      promoEndsAt = new Date();
      promoEndsAt.setMonth(promoEndsAt.getMonth() + (promo.promo_duration_months || 1));
      await this.promotionService.incrementUses(promo.id);
    }

    const now = new Date();
    const { first_end_date } = this.billingService.calculateProration(lockedPrice, now);

    // Referral benefits
    const benefitEnabled = await this.systemSettings.getSetting('referral_benefit_enabled');
    const discountPct = await this.systemSettings.getSetting('referral_discount_percentage');
    const benefitMonths = await this.systemSettings.getSetting('referral_benefit_months');
    let discount_percentage = 0;
    let discount_ends_at: Date | undefined;

    if (benefitEnabled === 'true' && referred_by_id) {
      discount_percentage = Number(discountPct) || 5;
      discount_ends_at = new Date();
      discount_ends_at.setMonth(discount_ends_at.getMonth() + (Number(benefitMonths) || 1));
      const referrerSub = await this.subscriptionRepo.findOne({ where: { tenant_id: referred_by_id }, order: { end_date: 'DESC' } });
      if (referrerSub) {
        referrerSub.discount_percentage = Number(discountPct) || 5;
        const refDiscountEnd = new Date();
        refDiscountEnd.setMonth(refDiscountEnd.getMonth() + (Number(benefitMonths) || 1));
        referrerSub.discount_ends_at = refDiscountEnd;
        await this.subscriptionRepo.save(referrerSub);
        this.notificationsGateway.sendReferralSuccessAlert(referred_by_id, {
          newBusinessName: savedTenant.business_name,
          discountPercentage: Number(discountPct) || 5,
        });
      }
    }

    await this.subscriptionRepo.save(this.subscriptionRepo.create({
      tenant_id: savedTenant.id,
      plan_id: pending.plan_id,
      locked_price: lockedPrice,
      locked_plan_name: plan?.name || 'N/A',
      billing_day: 10,
      start_date: now,
      end_date: first_end_date,
      auto_renew: true,
      status: SubscriptionStatus.ACTIVE,
      last_payment_date: (paymentMethod !== 'free' && paymentMethod !== 'trial') ? now : (undefined as any),
      next_billing_date: first_end_date,
      discount_percentage,
      discount_ends_at,
      promotion_id: promoId,
      price_after_promo: priceAfterPromo,
      promo_ends_at: promoEndsAt,
      mp_preapproval_id: pending.mp_preference_id || undefined,
    }));

    if (paymentMethod !== 'free' && paymentMethod !== 'trial') {
      await this.billingRepo.save(this.billingRepo.create({
        tenant_id: savedTenant.id,
        amount: pending.amount,
        payment_status: PaymentStatus.PAID,
        payment_method: paymentMethod,
        invoice_url: pending.mp_payment_id ?? undefined,
        plan_id: pending.plan_id,
        plan_name: plan?.name,
        billing_period_start: now,
        billing_period_end: first_end_date,
        is_prorated: true,
        promotion_id: promoId,
      }));
    }
    pending.tenant_id = savedTenant.id;
    await this.pendingRepo.save(pending);
    this.logger.log(`Cuenta creada: tenant=${savedTenant.id}, user=${pending.owner_email}, locked_price=$${lockedPrice}, billing_day=10`);
  }
  // ==========================================
  // SUPERADMIN: Aprobar transferencia manual
  // ==========================================
  async adminApprovePending(pendingId: string): Promise<{ message: string }> {
    const pending = await this.pendingRepo.findOne({ where: { id: pendingId } });
    if (!pending) throw new NotFoundException('Pending no encontrado');
    if (pending.status !== PendingSubscriptionStatus.MANUAL_PENDING) {
      throw new BadRequestException('Solo se pueden aprobar transferencias pendientes de revisión');
    }
    pending.status = PendingSubscriptionStatus.MANUAL_APPROVED;
    await this.pendingRepo.save(pending);
    await this.activateAccount(pending, 'transfer');
    await this.mailService.sendManualActivationEmail(pending.owner_email, pending.business_name);
    this.notificationsGateway.sendPendingPaymentResolved({
      pendingId: pending.id,
      businessName: pending.business_name,
      paymentMethod: pending.payment_method,
    });
    return { message: `Cuenta activada para ${pending.owner_email}` };
  }
  // ==========================================
  // SUPERADMIN: Listar pendientes manuales
  // ==========================================
  async getManualPendingList(): Promise<Partial<PendingSubscription>[]> {
    const pending = await this.pendingRepo.find({
      where: { status: PendingSubscriptionStatus.MANUAL_PENDING },
      order: { created_at: 'ASC' },
    });
    return pending.map(({ temp_password_hash: _passwordHash, ...safePending }) => safePending);
  }
  // ==========================================
  // INFO DE SANDBOX (testing)
  // ==========================================
  getSandboxInfo(): object {
    if (!this.isSandbox) return { sandbox: false };
    return {
      sandbox: true,
      message: 'Modo SANDBOX activo. Los pagos NO son reales.',
      test_cards: [
        { brand: 'Mastercard', number: '5031 7557 3453 0604', cvc: '123', expiry: '11/25', name: 'APRO', result: 'Aprobado' },
        { brand: 'Visa', number: '4509 9535 6623 3704', cvc: '123', expiry: '11/25', name: 'APRO', result: 'Aprobado' },
        { brand: 'Amex', number: '3711 803032 57522', cvc: '1234', expiry: '11/25', name: 'APRO', result: 'Aprobado' },
        { brand: 'Mastercard', number: '5031 7557 3453 0604', cvc: '123', expiry: '11/25', name: 'OTHE', result: 'Rechazado' },
      ],
      instructions: 'El nombre del titular determina el resultado: APRO = aprobado, OTHE = rechazado.',
    };
  }
}
