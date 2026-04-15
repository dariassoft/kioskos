import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { BillingHistory, PaymentStatus } from './entities/billing-history.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(BillingHistory)
    private readonly billingRepo: Repository<BillingHistory>,
  ) {}

  // ==========================================
  // PLANES
  // ==========================================
  async getActivePlans(): Promise<Plan[]> {
    return this.planRepo.find({ where: { is_active: true } });
  }

  async createPlan(data: Partial<Plan>): Promise<Plan> {
    const plan = this.planRepo.create(data);
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

  async isFeatureEnabled(tenantId: string, feature: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription) return false;

    const plan = await this.planRepo.findOne({ where: { id: subscription.plan_id } });
    if (!plan || !plan.features) return false;

    return plan.features[feature] === true;
  }

  async getMrr(): Promise<{ mrr: number; total_active: number }> {
    const activeSubscriptions = await this.subscriptionRepo
      .createQueryBuilder('sub')
      .innerJoin('sub.plan_id', 'plan')
      .where('sub.end_date > :today', { today: new Date() })
      .getMany();

    return {
      mrr: activeSubscriptions.length * 0, // Calcular con precio del plan
      total_active: activeSubscriptions.length,
    };
  }

  // ==========================================
  // CRON: Verificar suscripciones por vencer (cada día a las 9am)
  // ==========================================
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringSubscriptions() {
    console.log('[BillingService] Verificando suscripciones por vencer...');
    // TODO Fase 5: Enviar email de aviso 5 días antes del vencimiento
  }

  // ==========================================
  // HISTORIAL DE COBROS
  // ==========================================
  async getBillingHistory(tenantId: string): Promise<BillingHistory[]> {
    return this.billingRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }
}
