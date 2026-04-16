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
    private readonly config: ConfigService,
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
    const temp_password_hash = await bcrypt.hash(dto.password, 12);
    const pending = this.pendingRepo.create({
      plan_id: dto.plan_id,
      amount: plan.price_monthly,
      business_name: dto.business_name,
      owner_email: dto.owner_email,
      owner_name: dto.owner_name,
      owner_phone: dto.owner_phone,
      tax_id: dto.tax_id,
      temp_password_hash,
      payment_method: dto.payment_method,
      status: PendingSubscriptionStatus.PENDING,
    });
    const savedPending = await this.pendingRepo.save(pending);
    // Plan gratuito -> activar directo
    if (Number(plan.price_monthly) === 0) {
      savedPending.status = PendingSubscriptionStatus.APPROVED;
      await this.pendingRepo.save(savedPending);
      await this.activateAccount(savedPending, 'free');
      return { pending_id: savedPending.id, payment_method: 'free', is_free: true };
    }
    if (dto.payment_method === 'mercadopago') {
      return this.createMercadoPagoSubscription(savedPending, plan);
    }
    return this.createTransferInstructions(savedPending);
  }
  // ─── MercadoPago: suscripcion recurrente mensual ──────────────────────────
  private async createMercadoPagoSubscription(pending: PendingSubscription, plan: Plan): Promise<any> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const preApprovalClient = new PreApproval(this.mp);
    const preApproval = await preApprovalClient.create({
      body: {
        reason: `Kioskos & Despenzas - Plan ${plan.name} (mensual automatico)`,
        external_reference: pending.id,
        payer_email: pending.owner_email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: Number(plan.price_monthly),
          currency_id: 'ARS',
        },
        back_url: `${frontendUrl}/checkout/success?pending=${pending.id}`,
        status: 'pending',
      } as any,
    });
    pending.mp_preference_id = preApproval.id ?? '';
    pending.mp_init_point = preApproval.init_point ?? '';
    await this.pendingRepo.save(pending);
    this.logger.log(`Suscripcion MP creada: ${preApproval.id} para ${pending.owner_email}`);
    return {
      pending_id: pending.id,
      payment_method: 'mercadopago',
      mp_init_point: preApproval.init_point ?? '',
      sandbox: this.isSandbox,
    };
  }
  // ─── Transferencia: instrucciones ────────────────────────────────────────
  private async createTransferInstructions(pending: PendingSubscription): Promise<any> {
    const alias = this.config.get<string>('TRANSFER_ALIAS') ?? 'kioskos.despenzas';
    const cbu = this.config.get<string>('TRANSFER_CBU') ?? '0000000000000000000000';
    return {
      pending_id: pending.id,
      payment_method: 'transfer',
      transfer_data: {
        alias,
        cbu,
        amount: Number(pending.amount),
        reference: `KD-${pending.id.split('-')[0].toUpperCase()}`,
      },
    };
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
  async activateAccount(pending: PendingSubscription, paymentMethod: string): Promise<void> {
    const existingUser = await this.userRepo.findOne({ where: { email: pending.owner_email } });
    if (existingUser) {
      this.logger.warn(`Usuario ${pending.owner_email} ya existe, no se duplica`);
      return;
    }
    const tenant = this.tenantRepo.create({
      business_name: pending.business_name,
      owner_email: pending.owner_email,
      tax_id: pending.tax_id ?? undefined,
      phone: pending.owner_phone ?? undefined,
      status: TenantStatus.ACTIVE,
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
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);
    await this.subscriptionRepo.save(this.subscriptionRepo.create({
      tenant_id: savedTenant.id,
      plan_id: pending.plan_id,
      start_date: now,
      end_date: endDate,
      auto_renew: true,
      last_payment_date: paymentMethod !== 'free' ? now : (undefined as any),
      next_billing_date: endDate,
    }));
    if (paymentMethod !== 'free') {
      await this.billingRepo.save(this.billingRepo.create({
        tenant_id: savedTenant.id,
        amount: pending.amount,
        payment_status: PaymentStatus.PAID,
        payment_method: paymentMethod,
        invoice_url: pending.mp_payment_id ?? undefined,
      }));
    }
    pending.tenant_id = savedTenant.id;
    await this.pendingRepo.save(pending);
    this.logger.log(`Cuenta creada: tenant=${savedTenant.id}, user=${pending.owner_email}`);
  }
  // ==========================================
  // SUPERADMIN: Aprobar transferencia manual
  // ==========================================
  async adminApprovePending(pendingId: string): Promise<{ message: string }> {
    const pending = await this.pendingRepo.findOne({ where: { id: pendingId } });
    if (!pending) throw new NotFoundException('Pending no encontrado');
    if (
      pending.status === PendingSubscriptionStatus.APPROVED ||
      pending.status === PendingSubscriptionStatus.MANUAL_APPROVED
    ) {
      throw new BadRequestException('Ya fue aprobado');
    }
    pending.status = PendingSubscriptionStatus.MANUAL_APPROVED;
    await this.pendingRepo.save(pending);
    await this.activateAccount(pending, 'transfer');
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
  async getManualPendingList(): Promise<PendingSubscription[]> {
    return this.pendingRepo.find({
      where: { status: PendingSubscriptionStatus.MANUAL_PENDING },
      order: { created_at: 'ASC' },
    });
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
