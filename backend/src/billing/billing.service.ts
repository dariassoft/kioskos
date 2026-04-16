import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { BillingHistory, PaymentStatus } from './entities/billing-history.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Tenant, TenantStatus } from '../tenants/entities/tenant.entity';

// DTO interno para registrar un pago
export interface RegisterPaymentDto {
  tenant_id: string;
  amount: number;
  payment_method: string; // 'cash' | 'transfer' | 'mercadopago'
  notes?: string;
  months?: number; // cuántos meses renueva (default: 1)
}

// DTO para cambiar el plan de un tenant
export interface ChangePlanDto {
  tenant_id: string;
  new_plan_id: string;
}

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(BillingHistory)
    private readonly billingRepo: Repository<BillingHistory>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

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
    const today = new Date();
    return this.subscriptionRepo.findOne({
      where: { tenant_id: tenantId, end_date: MoreThan(today) as any },
    });
  }

  /**
   * Devuelve todas las suscripciones con datos del tenant y del plan (JOIN manual)
   */
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
        return { ...sub, tenant, plan, days_left: daysLeft, is_expired: daysLeft < 0 };
      }),
    );

    return results;
  }

  async changePlan(dto: ChangePlanDto): Promise<Subscription> {
    const plan = await this.planRepo.findOne({ where: { id: dto.new_plan_id } });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    let subscription = await this.getActiveSubscription(dto.tenant_id);

    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 1);

    if (subscription) {
      subscription.plan_id = dto.new_plan_id;
      subscription.start_date = today;
      subscription.end_date = endDate;
    } else {
      subscription = this.subscriptionRepo.create({
        tenant_id: dto.tenant_id,
        plan_id: dto.new_plan_id,
        start_date: today,
        end_date: endDate,
        auto_renew: true,
      });
    }

    return this.subscriptionRepo.save(subscription);
  }

  async isFeatureEnabled(tenantId: string, feature: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription) return false;
    const plan = await this.planRepo.findOne({ where: { id: subscription.plan_id } });
    if (!plan || !plan.features) return false;
    return plan.features[feature] === true;
  }

  // ==========================================
  // PAGOS Y BILLING HISTORY
  // ==========================================

  /**
   * Registra un pago manual y extiende la suscripción del tenant.
   */
  async registerPayment(dto: RegisterPaymentDto): Promise<BillingHistory> {
    const tenant = await this.tenantRepo.findOne({ where: { id: dto.tenant_id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const months = dto.months ?? 1;

    // Crear registro de pago
    const payment = this.billingRepo.create({
      tenant_id: dto.tenant_id,
      amount: dto.amount,
      payment_status: PaymentStatus.PAID,
      payment_method: dto.payment_method,
      invoice_url: dto.notes ?? undefined,
    });
    await this.billingRepo.save(payment);

    // Extender o crear suscripción
    let subscription = await this.subscriptionRepo.findOne({
      where: { tenant_id: dto.tenant_id },
      order: { end_date: 'DESC' },
    });

    const now = new Date();
    if (subscription) {
      const currentEnd = new Date(subscription.end_date);
      const base = currentEnd > now ? currentEnd : now;
      base.setMonth(base.getMonth() + months);
      subscription.end_date = base;
      subscription.last_payment_date = now;
      subscription.next_billing_date = base;
    } else {
      // Sin suscripción activa: obtener el plan más básico
      const basicPlan = await this.planRepo.findOne({ where: { is_active: true }, order: { price_monthly: 'ASC' } });
      if (!basicPlan) throw new BadRequestException('No hay planes disponibles');
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + months);
      subscription = this.subscriptionRepo.create({
        tenant_id: dto.tenant_id,
        plan_id: basicPlan.id,
        start_date: now,
        end_date: endDate,
        last_payment_date: now,
        next_billing_date: endDate,
        auto_renew: true,
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

    const history = await this.billingRepo.find({
      where,
      order: { created_at: 'DESC' },
    });

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
  // MÉTRICAS SUPERADMIN
  // ==========================================
  async getMrr(): Promise<{
    mrr: number;
    total_active: number;
    total_tenants: number;
    expiring_soon: number;
    monthly_revenue: { month: string; revenue: number }[];
  }> {
    const today = new Date();
    const activeSubscriptions = await this.subscriptionRepo.find({
      where: { end_date: MoreThan(today) as any },
    });

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      const plan = await this.planRepo.findOne({ where: { id: sub.plan_id } });
      if (plan) mrr += Number(plan.price_monthly);
    }

    // Vencen en los próximos 7 días
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    const expiringSoon = await this.subscriptionRepo.count({
      where: { end_date: Between(today, soon) as any },
    });

    const totalTenants = await this.tenantRepo.count();

    // Ingresos de los últimos 6 meses (desde billing_history)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const revenueRaw = await this.billingRepo
      .createQueryBuilder('bh')
      .select("DATE_FORMAT(bh.created_at, '%Y-%m') AS month")
      .addSelect('SUM(bh.amount) AS revenue')
      .where('bh.created_at >= :from', { from: sixMonthsAgo })
      .andWhere('bh.payment_status = :status', { status: PaymentStatus.PAID })
      .groupBy("DATE_FORMAT(bh.created_at, '%Y-%m')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return {
      mrr,
      total_active: activeSubscriptions.length,
      total_tenants: totalTenants,
      expiring_soon: expiringSoon,
      monthly_revenue: revenueRaw.map((r) => ({
        month: r.month,
        revenue: Number(r.revenue),
      })),
    };
  }

  async getExpiringSubscriptions(days = 7): Promise<any[]> {
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + days);

    const subs = await this.subscriptionRepo.find({
      where: { end_date: Between(today, limit) as any },
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
  }

  // ==========================================
  // CRON: Verificar suscripciones por vencer
  // ==========================================
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringSubscriptions() {
    const expiring = await this.getExpiringSubscriptions(5);
    if (expiring.length > 0) {
      console.log(`[Billing] ⚠️  ${expiring.length} suscripciones vencen en los próximos 5 días`);
      // TODO Fase 8: Enviar email de aviso por tenant
    }
  }
}
