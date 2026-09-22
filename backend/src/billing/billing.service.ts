import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between, LessThanOrEqual } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { BillingHistory, PaymentStatus } from './entities/billing-history.entity';
import { Promotion } from './entities/promotion.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Tenant, TenantStatus } from '../tenants/entities/tenant.entity';
import { ConfigService } from '@nestjs/config';
import MercadoPago, { PreApproval } from 'mercadopago';

// DTO interno para registrar un pago
export interface RegisterPaymentDto {
  tenant_id: string;
  amount: number;
  payment_method: string;
  notes?: string;
  months?: number;
}

// DTO para cambiar el plan de un tenant
export interface ChangePlanDto {
  tenant_id: string;
  new_plan_id: string;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(BillingHistory)
    private readonly billingRepo: Repository<BillingHistory>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly config: ConfigService,
  ) {
    const accessToken = this.config.get<string>('MP_ACCESS_TOKEN') ?? '';
    this.mp = new MercadoPago({ accessToken });
  }

  private readonly mp: MercadoPago;

  // ==========================================
  // PLANES
  // ==========================================
  async getActivePlans(): Promise<Plan[]> {
    return this.planRepo.find({ where: { is_active: true }, order: { price_monthly: 'ASC' } });
  }

  async getAllPlans(): Promise<Plan[]> {
    return this.planRepo.find({ order: { price_monthly: 'ASC' } });
  }

  async createPlan(data: Partial<Plan>): Promise<Plan> {
    const plan = this.planRepo.create(data);
    return this.planRepo.save(plan);
  }

  async updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan ${id} no encontrado`);
    Object.assign(plan, data);
    return this.planRepo.save(plan);
  }

  async togglePlanStatus(id: string): Promise<Plan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan ${id} no encontrado`);
    plan.is_active = !plan.is_active;
    return this.planRepo.save(plan);
  }

  // ==========================================
  // SUSCRIPCIONES
  // ==========================================
  async getActiveSubscription(tenantId: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findOne({
      where: { tenant_id: tenantId, status: SubscriptionStatus.ACTIVE },
    });
  }

  async getAllSubscriptionsWithDetails(): Promise<any[]> {
    const subscriptions = await this.subscriptionRepo.find({
      order: { created_at: 'DESC' },
    });

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const tenant = await this.tenantRepo.findOne({ where: { id: sub.tenant_id } });
        const plan = await this.planRepo.findOne({ where: { id: sub.plan_id } });
        const today = new Date();
        const endDate = new Date(sub.end_date);
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...sub,
          tenant,
          plan,
          days_left: daysLeft,
          is_expired: daysLeft < 0,
        };
      }),
    );
    return results;
  }

  async changePlan(dto: ChangePlanDto): Promise<Subscription> {
    const plan = await this.planRepo.findOne({ where: { id: dto.new_plan_id, is_active: true } });
    if (!plan) throw new NotFoundException('Plan no encontrado o inactivo');
    const tenant = await this.tenantRepo.findOne({ where: { id: dto.tenant_id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    let subscription = await this.getActiveSubscription(dto.tenant_id);
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 1);

    if (subscription) {
      subscription.plan_id = dto.new_plan_id;
      subscription.locked_price = Number(plan.price_monthly);
      subscription.locked_plan_name = plan.name;
      subscription.start_date = today;
      subscription.end_date = endDate;
    } else {
      subscription = this.subscriptionRepo.create({
        tenant_id: dto.tenant_id,
        plan_id: dto.new_plan_id,
        locked_price: Number(plan.price_monthly),
        locked_plan_name: plan.name,
        billing_day: 10,
        start_date: today,
        end_date: endDate,
        auto_renew: true,
        status: SubscriptionStatus.ACTIVE,
      });
    }
    return this.subscriptionRepo.save(subscription);
  }

  async isFeatureEnabled(tenantId: string, feature: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription) return false;
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant || tenant.status === TenantStatus.SUSPENDED || tenant.status === TenantStatus.PAST_DUE) return false;
    if (tenant.status === TenantStatus.TRIAL && tenant.trial_ends_at && tenant.trial_ends_at < new Date()) return false;
    if (!subscription.end_date) return false;
    const subscriptionEnd = new Date(subscription.end_date);
    subscriptionEnd.setHours(23, 59, 59, 999);
    if (subscriptionEnd < new Date()) return false;
    const plan = await this.planRepo.findOne({ where: { id: subscription.plan_id } });
    if (!plan || !plan.is_active || !plan.features) return false;
    return plan.features[feature] === true;
  }

  // ==========================================
  // CANCELACIÓN DE SUSCRIPCIÓN (por el usuario)
  // ==========================================
  async cancelSubscription(tenantId: string, reason?: string): Promise<{ message: string; access_until: string }> {
    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription) throw new NotFoundException('No hay suscripción activa');

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelled_at = new Date();
    subscription.cancellation_reason = reason || 'Cancelación voluntaria del usuario';
    subscription.auto_renew = false;
    await this.subscriptionRepo.save(subscription);

    // Si el período actual está pago, dejar acceso hasta end_date
    const endDate = new Date(subscription.end_date);
    const today = new Date();

    if (endDate > today) {
      // Acceso hasta fin del período pago
      return {
        message: `Suscripción cancelada. Tenés acceso hasta el ${endDate.toLocaleDateString('es-AR')}.`,
        access_until: endDate.toISOString().slice(0, 10),
      };
    } else {
      // No hay período pago vigente, suspender inmediato
      await this.tenantRepo.update(tenantId, { status: TenantStatus.SUSPENDED });
      return {
        message: 'Suscripción cancelada. Tu acceso ha sido desactivado.',
        access_until: today.toISOString().slice(0, 10),
      };
    }
  }

  // ==========================================
  // COBROS PRÓXIMOS (SuperAdmin)
  // ==========================================
  async getUpcomingCharges(days = 30): Promise<any[]> {
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + days);

    const subs = await this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        next_billing_date: Between(today, limit) as any,
      },
      order: { next_billing_date: 'ASC' },
    });

    return Promise.all(
      subs.map(async (sub) => {
        const tenant = await this.tenantRepo.findOne({ where: { id: sub.tenant_id } });
        const billingDate = new Date(sub.next_billing_date);
        const daysUntil = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Determinar el precio a cobrar
        let chargeAmount = Number(sub.locked_price);
        if (sub.promo_ends_at && new Date(sub.promo_ends_at) <= billingDate) {
          chargeAmount = Number(sub.price_after_promo) || chargeAmount;
        }

        return {
          subscription_id: sub.id,
          tenant_id: sub.tenant_id,
          business_name: tenant?.business_name || 'N/A',
          plan_name: sub.locked_plan_name,
          locked_price: Number(sub.locked_price),
          charge_amount: chargeAmount,
          next_billing_date: sub.next_billing_date,
          days_until_due: daysUntil,
          has_promo: !!sub.promotion_id,
          promo_ends_at: sub.promo_ends_at,
        };
      }),
    );
  }

  // ==========================================
  // PAGOS Y BILLING HISTORY
  // ==========================================
  async registerPayment(dto: RegisterPaymentDto): Promise<BillingHistory> {
    const tenant = await this.tenantRepo.findOne({ where: { id: dto.tenant_id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const months = dto.months ?? 1;

    let subscription = await this.subscriptionRepo.findOne({
      where: { tenant_id: dto.tenant_id },
      order: { end_date: 'DESC' },
    });

    const plan = subscription
      ? await this.planRepo.findOne({ where: { id: subscription.plan_id } })
      : null;
    const basicPlan = subscription
      ? null
      : await this.planRepo.findOne({ where: { is_active: true }, order: { price_monthly: 'ASC' } });
    if (!subscription && !basicPlan) throw new BadRequestException('No hay planes disponibles');

    // Crear registro de pago con período
    const now = new Date();
    const periodStart = new Date(now);
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + months);

    const payment = this.billingRepo.create({
      tenant_id: dto.tenant_id,
      amount: dto.amount,
      payment_status: PaymentStatus.PAID,
      payment_method: dto.payment_method,
      invoice_url: dto.notes ?? undefined,
      plan_id: subscription?.plan_id,
      plan_name: subscription?.locked_plan_name || plan?.name,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
    });
    await this.billingRepo.save(payment);

    // Extender o crear suscripción
    if (subscription) {
      const currentEnd = new Date(subscription.end_date);
      const base = currentEnd > now ? currentEnd : now;
      base.setMonth(base.getMonth() + months);
      subscription.end_date = base;
      subscription.last_payment_date = now;
      subscription.next_billing_date = base;
      subscription.status = SubscriptionStatus.ACTIVE;
    } else {
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + months);
      subscription = this.subscriptionRepo.create({
        tenant_id: dto.tenant_id,
        plan_id: basicPlan!.id,
        locked_price: Number(basicPlan!.price_monthly),
        locked_plan_name: basicPlan!.name,
        billing_day: 10,
        start_date: now,
        end_date: endDate,
        last_payment_date: now,
        next_billing_date: endDate,
        auto_renew: true,
        status: SubscriptionStatus.ACTIVE,
      });
    }
    await this.subscriptionRepo.save(subscription);

    // Activar el tenant si estaba suspendido
    if (tenant.status !== TenantStatus.ACTIVE) {
      await this.tenantRepo.update(tenant.id, { status: TenantStatus.ACTIVE });
    }

    return payment;
  }

  async getAllBillingHistory(tenantId?: string): Promise<any[]> {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    const history = await this.billingRepo.find({ where, order: { created_at: 'DESC' } });
    return Promise.all(
      history.map(async (h) => {
        const tenant = await this.tenantRepo.findOne({ where: { id: h.tenant_id } });
        return { ...h, tenant_name: tenant?.business_name ?? h.tenant_id };
      }),
    );
  }

  async getBillingHistory(tenantId: string): Promise<BillingHistory[]> {
    return this.billingRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  // ==========================================
  // MÉTRICAS SUPERADMIN — MRR CORREGIDO
  // ==========================================
  async getMrr(): Promise<{
    mrr: number;
    total_active: number;
    total_tenants: number;
    expiring_soon: number;
    monthly_revenue: { month: string; revenue: number }[];
  }> {
    try {
      const activeSubscriptions = await this.subscriptionRepo.find({
        where: { status: SubscriptionStatus.ACTIVE },
      });

      // MRR se calcula con locked_price (precio que aceptó el suscriptor)
      let mrr = 0;
      for (const sub of activeSubscriptions) {
        mrr += Number(sub.locked_price) || 0;
      }

      const today = new Date();
      const soon = new Date();
      soon.setDate(soon.getDate() + 7);
      const expiringSoon = await this.subscriptionRepo.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          end_date: Between(today, soon) as any,
        },
      });

      const totalTenants = await this.tenantRepo.count();

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const recentPayments = await this.billingRepo.find({
        where: {
          created_at: MoreThan(sixMonthsAgo),
          payment_status: PaymentStatus.PAID,
        },
        order: { created_at: 'ASC' },
      });

      const revenueMap = new Map<string, number>();
      recentPayments.forEach((p) => {
        const date = new Date(p.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        revenueMap.set(monthKey, (revenueMap.get(monthKey) || 0) + Number(p.amount));
      });

      const monthly_revenue = Array.from(revenueMap.entries()).map(([month, revenue]) => ({
        month,
        revenue,
      }));

      return { mrr, total_active: activeSubscriptions.length, total_tenants: totalTenants, expiring_soon: expiringSoon, monthly_revenue };
    } catch (error) {
      this.logger.error('[BillingService] Error fetching MRR metrics:', error);
      return { mrr: 0, total_active: 0, total_tenants: 0, expiring_soon: 0, monthly_revenue: [] };
    }
  }

  async getExpiringSubscriptions(days = 7): Promise<any[]> {
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + days);

    try {
      const subs = await this.subscriptionRepo.find({
        where: { status: SubscriptionStatus.ACTIVE, end_date: Between(today, limit) as any },
      });

      return Promise.all(
        subs.map(async (sub) => {
          const tenant = await this.tenantRepo.findOne({ where: { id: sub.tenant_id } });
          const plan = await this.planRepo.findOne({ where: { id: sub.plan_id } });
          const daysLeft = Math.ceil(
            (new Date(sub.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          return { ...sub, tenant, plan, days_left: daysLeft };
        }),
      );
    } catch (error) {
      this.logger.error('[BillingService] Error fetching expiring subscriptions:', error);
      return [];
    }
  }

  // ==========================================
  // CRON: Suspender tenants con suscripción vencida
  // ==========================================
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringSubscriptions() {
    const today = new Date();

    // 1. Suspender suscripciones vencidas
    const expiredSubs = await this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        end_date: LessThan(today) as any,
      },
    });

    for (const sub of expiredSubs) {
      sub.status = SubscriptionStatus.PAST_DUE;
      await this.subscriptionRepo.save(sub);
      await this.tenantRepo.update(sub.tenant_id, { status: TenantStatus.PAST_DUE });
      this.logger.warn(`⚠️  Tenant ${sub.tenant_id} marcado como PAST_DUE (suscripción vencida)`);
    }

    // 2. Suspender tenants cancelados cuyo período pago expiró
    const cancelledExpired = await this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.CANCELLED,
        end_date: LessThan(today) as any,
      },
    });

    for (const sub of cancelledExpired) {
      sub.status = SubscriptionStatus.SUSPENDED;
      await this.subscriptionRepo.save(sub);
      await this.tenantRepo.update(sub.tenant_id, { status: TenantStatus.SUSPENDED });
      this.logger.warn(`🔒 Tenant ${sub.tenant_id} SUSPENDIDO (cancelado y período pago expirado)`);
    }

    // 3. Alertar suscripciones que vencen en 5 días
    const soon = new Date();
    soon.setDate(soon.getDate() + 5);
    const expiringSoon = await this.subscriptionRepo.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        end_date: Between(today, soon) as any,
      },
    });

    if (expiringSoon > 0) {
      this.logger.log(`📧 ${expiringSoon} suscripciones vencen en los próximos 5 días`);
    }

    // 4. Procesar transiciones de precio promocional a normal
    await this.handlePromoTransitions();
  }

  // ==========================================
  // TRANSICIÓN PROMO -> NORMAL
  // ==========================================
  async handlePromoTransitions() {
    const today = new Date();
    
    // Buscar suscripciones cuya promo ya venció
    const transitions = await this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        promo_ends_at: LessThanOrEqual(today) as any,
      },
    });

    if (transitions.length === 0) return;

    this.logger.log(`🔄 Procesando ${transitions.length} transiciones de precio promo -> normal`);

    for (const sub of transitions) {
      const oldPrice = sub.locked_price;
      const newPrice = sub.price_after_promo;

      if (!newPrice) {
        // Si no hay precio de backup, simplemente limpiar promo
        sub.promotion_id = null;
        sub.promo_ends_at = null;
        await this.subscriptionRepo.save(sub);
        continue;
      }

      this.logger.log(`   - Tenant ${sub.tenant_id}: $${oldPrice} -> $${newPrice}`);

      // 1. Actualizar en nuestra DB
      sub.locked_price = newPrice;
      sub.promotion_id = null;
      sub.promo_ends_at = null;
      sub.price_after_promo = null;

      // 2. Si tiene MercadoPago, intentar actualizar el monto de la suscripción recurrente
      if (sub.mp_preapproval_id) {
        try {
          const preApprovalClient = new PreApproval(this.mp);
          await preApprovalClient.update({
            id: sub.mp_preapproval_id,
            body: {
              auto_recurring: {
                transaction_amount: Number(newPrice),
              },
            } as any,
          });
          this.logger.log(`     ✅ MercadoPago actualizado a $${newPrice}`);
        } catch (err) {
          this.logger.error(`     ❌ Error actualizando MercadoPago para tenant ${sub.tenant_id}:`, err);
          // TODO: Enviar alerta al SuperAdmin si falla el update de MP
        }
      }

      await this.subscriptionRepo.save(sub);
    }
  }

  // ==========================================
  // UTILIDAD: Calcular prorrateo día 10
  // ==========================================
  calculateProration(fullPrice: number, subscriptionDate: Date): { prorated_amount: number; first_end_date: Date } {
    const billingDay = 10;
    const subDate = new Date(subscriptionDate);
    let nextBillingDate: Date;

    if (subDate.getDate() <= billingDay) {
      // Se suscribe antes del 10 → primer cobro el 10 de este mes
      nextBillingDate = new Date(subDate.getFullYear(), subDate.getMonth(), billingDay);
    } else {
      // Se suscribe después del 10 → primer cobro el 10 del mes siguiente
      nextBillingDate = new Date(subDate.getFullYear(), subDate.getMonth() + 1, billingDay);
    }

    // Días del prorrateo
    const diffMs = nextBillingDate.getTime() - subDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Prorrateo basado en 30 días
    const dailyRate = fullPrice / 30;
    const prorated_amount = Math.round(dailyRate * diffDays * 100) / 100;

    return { prorated_amount, first_end_date: nextBillingDate };
  }
}
