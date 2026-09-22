"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const plan_entity_1 = require("./entities/plan.entity");
const subscription_entity_1 = require("./entities/subscription.entity");
const billing_history_entity_1 = require("./entities/billing-history.entity");
const schedule_1 = require("@nestjs/schedule");
const tenant_entity_1 = require("../tenants/entities/tenant.entity");
const config_1 = require("@nestjs/config");
const mercadopago_1 = __importStar(require("mercadopago"));
let BillingService = BillingService_1 = class BillingService {
    constructor(planRepo, subscriptionRepo, billingRepo, tenantRepo, config) {
        this.planRepo = planRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.billingRepo = billingRepo;
        this.tenantRepo = tenantRepo;
        this.config = config;
        this.logger = new common_1.Logger(BillingService_1.name);
        const accessToken = this.config.get('MP_ACCESS_TOKEN') ?? '';
        this.mp = new mercadopago_1.default({ accessToken });
    }
    async getActivePlans() {
        return this.planRepo.find({ where: { is_active: true }, order: { price_monthly: 'ASC' } });
    }
    async getAllPlans() {
        return this.planRepo.find({ order: { price_monthly: 'ASC' } });
    }
    async createPlan(data) {
        const plan = this.planRepo.create(data);
        return this.planRepo.save(plan);
    }
    async updatePlan(id, data) {
        const plan = await this.planRepo.findOne({ where: { id } });
        if (!plan)
            throw new common_1.NotFoundException(`Plan ${id} no encontrado`);
        Object.assign(plan, data);
        return this.planRepo.save(plan);
    }
    async togglePlanStatus(id) {
        const plan = await this.planRepo.findOne({ where: { id } });
        if (!plan)
            throw new common_1.NotFoundException(`Plan ${id} no encontrado`);
        plan.is_active = !plan.is_active;
        return this.planRepo.save(plan);
    }
    async getActiveSubscription(tenantId) {
        return this.subscriptionRepo.findOne({
            where: { tenant_id: tenantId, status: subscription_entity_1.SubscriptionStatus.ACTIVE },
        });
    }
    async getAllSubscriptionsWithDetails() {
        const subscriptions = await this.subscriptionRepo.find({
            order: { created_at: 'DESC' },
        });
        const results = await Promise.all(subscriptions.map(async (sub) => {
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
        }));
        return results;
    }
    async changePlan(dto) {
        const plan = await this.planRepo.findOne({ where: { id: dto.new_plan_id, is_active: true } });
        if (!plan)
            throw new common_1.NotFoundException('Plan no encontrado o inactivo');
        const tenant = await this.tenantRepo.findOne({ where: { id: dto.tenant_id } });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant no encontrado');
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
        }
        else {
            subscription = this.subscriptionRepo.create({
                tenant_id: dto.tenant_id,
                plan_id: dto.new_plan_id,
                locked_price: Number(plan.price_monthly),
                locked_plan_name: plan.name,
                billing_day: 10,
                start_date: today,
                end_date: endDate,
                auto_renew: true,
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
            });
        }
        return this.subscriptionRepo.save(subscription);
    }
    async isFeatureEnabled(tenantId, feature) {
        const subscription = await this.getActiveSubscription(tenantId);
        if (!subscription)
            return false;
        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant || tenant.status === tenant_entity_1.TenantStatus.SUSPENDED || tenant.status === tenant_entity_1.TenantStatus.PAST_DUE)
            return false;
        if (tenant.status === tenant_entity_1.TenantStatus.TRIAL && tenant.trial_ends_at && tenant.trial_ends_at < new Date())
            return false;
        if (!subscription.end_date)
            return false;
        const subscriptionEnd = new Date(subscription.end_date);
        subscriptionEnd.setHours(23, 59, 59, 999);
        if (subscriptionEnd < new Date())
            return false;
        const plan = await this.planRepo.findOne({ where: { id: subscription.plan_id } });
        if (!plan || !plan.is_active || !plan.features)
            return false;
        return plan.features[feature] === true;
    }
    async cancelSubscription(tenantId, reason) {
        const subscription = await this.getActiveSubscription(tenantId);
        if (!subscription)
            throw new common_1.NotFoundException('No hay suscripción activa');
        subscription.status = subscription_entity_1.SubscriptionStatus.CANCELLED;
        subscription.cancelled_at = new Date();
        subscription.cancellation_reason = reason || 'Cancelación voluntaria del usuario';
        subscription.auto_renew = false;
        await this.subscriptionRepo.save(subscription);
        const endDate = new Date(subscription.end_date);
        const today = new Date();
        if (endDate > today) {
            return {
                message: `Suscripción cancelada. Tenés acceso hasta el ${endDate.toLocaleDateString('es-AR')}.`,
                access_until: endDate.toISOString().slice(0, 10),
            };
        }
        else {
            await this.tenantRepo.update(tenantId, { status: tenant_entity_1.TenantStatus.SUSPENDED });
            return {
                message: 'Suscripción cancelada. Tu acceso ha sido desactivado.',
                access_until: today.toISOString().slice(0, 10),
            };
        }
    }
    async getUpcomingCharges(days = 30) {
        const today = new Date();
        const limit = new Date();
        limit.setDate(limit.getDate() + days);
        const subs = await this.subscriptionRepo.find({
            where: {
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                next_billing_date: (0, typeorm_2.Between)(today, limit),
            },
            order: { next_billing_date: 'ASC' },
        });
        return Promise.all(subs.map(async (sub) => {
            const tenant = await this.tenantRepo.findOne({ where: { id: sub.tenant_id } });
            const billingDate = new Date(sub.next_billing_date);
            const daysUntil = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
        }));
    }
    async registerPayment(dto) {
        const tenant = await this.tenantRepo.findOne({ where: { id: dto.tenant_id } });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant no encontrado');
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
        if (!subscription && !basicPlan)
            throw new common_1.BadRequestException('No hay planes disponibles');
        const now = new Date();
        const periodStart = new Date(now);
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + months);
        const payment = this.billingRepo.create({
            tenant_id: dto.tenant_id,
            amount: dto.amount,
            payment_status: billing_history_entity_1.PaymentStatus.PAID,
            payment_method: dto.payment_method,
            invoice_url: dto.notes ?? undefined,
            plan_id: subscription?.plan_id,
            plan_name: subscription?.locked_plan_name || plan?.name,
            billing_period_start: periodStart,
            billing_period_end: periodEnd,
        });
        await this.billingRepo.save(payment);
        if (subscription) {
            const currentEnd = new Date(subscription.end_date);
            const base = currentEnd > now ? currentEnd : now;
            base.setMonth(base.getMonth() + months);
            subscription.end_date = base;
            subscription.last_payment_date = now;
            subscription.next_billing_date = base;
            subscription.status = subscription_entity_1.SubscriptionStatus.ACTIVE;
        }
        else {
            const endDate = new Date(now);
            endDate.setMonth(endDate.getMonth() + months);
            subscription = this.subscriptionRepo.create({
                tenant_id: dto.tenant_id,
                plan_id: basicPlan.id,
                locked_price: Number(basicPlan.price_monthly),
                locked_plan_name: basicPlan.name,
                billing_day: 10,
                start_date: now,
                end_date: endDate,
                last_payment_date: now,
                next_billing_date: endDate,
                auto_renew: true,
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
            });
        }
        await this.subscriptionRepo.save(subscription);
        if (tenant.status !== tenant_entity_1.TenantStatus.ACTIVE) {
            await this.tenantRepo.update(tenant.id, { status: tenant_entity_1.TenantStatus.ACTIVE });
        }
        return payment;
    }
    async getAllBillingHistory(tenantId) {
        const where = {};
        if (tenantId)
            where.tenant_id = tenantId;
        const history = await this.billingRepo.find({ where, order: { created_at: 'DESC' } });
        return Promise.all(history.map(async (h) => {
            const tenant = await this.tenantRepo.findOne({ where: { id: h.tenant_id } });
            return { ...h, tenant_name: tenant?.business_name ?? h.tenant_id };
        }));
    }
    async getBillingHistory(tenantId) {
        return this.billingRepo.find({
            where: { tenant_id: tenantId },
            order: { created_at: 'DESC' },
        });
    }
    async getMrr() {
        try {
            const activeSubscriptions = await this.subscriptionRepo.find({
                where: { status: subscription_entity_1.SubscriptionStatus.ACTIVE },
            });
            let mrr = 0;
            for (const sub of activeSubscriptions) {
                mrr += Number(sub.locked_price) || 0;
            }
            const today = new Date();
            const soon = new Date();
            soon.setDate(soon.getDate() + 7);
            const expiringSoon = await this.subscriptionRepo.count({
                where: {
                    status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                    end_date: (0, typeorm_2.Between)(today, soon),
                },
            });
            const totalTenants = await this.tenantRepo.count();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);
            const recentPayments = await this.billingRepo.find({
                where: {
                    created_at: (0, typeorm_2.MoreThan)(sixMonthsAgo),
                    payment_status: billing_history_entity_1.PaymentStatus.PAID,
                },
                order: { created_at: 'ASC' },
            });
            const revenueMap = new Map();
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
        }
        catch (error) {
            this.logger.error('[BillingService] Error fetching MRR metrics:', error);
            return { mrr: 0, total_active: 0, total_tenants: 0, expiring_soon: 0, monthly_revenue: [] };
        }
    }
    async getExpiringSubscriptions(days = 7) {
        const today = new Date();
        const limit = new Date();
        limit.setDate(limit.getDate() + days);
        try {
            const subs = await this.subscriptionRepo.find({
                where: { status: subscription_entity_1.SubscriptionStatus.ACTIVE, end_date: (0, typeorm_2.Between)(today, limit) },
            });
            return Promise.all(subs.map(async (sub) => {
                const tenant = await this.tenantRepo.findOne({ where: { id: sub.tenant_id } });
                const plan = await this.planRepo.findOne({ where: { id: sub.plan_id } });
                const daysLeft = Math.ceil((new Date(sub.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return { ...sub, tenant, plan, days_left: daysLeft };
            }));
        }
        catch (error) {
            this.logger.error('[BillingService] Error fetching expiring subscriptions:', error);
            return [];
        }
    }
    async checkExpiringSubscriptions() {
        const today = new Date();
        const expiredSubs = await this.subscriptionRepo.find({
            where: {
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                end_date: (0, typeorm_2.LessThan)(today),
            },
        });
        for (const sub of expiredSubs) {
            sub.status = subscription_entity_1.SubscriptionStatus.PAST_DUE;
            await this.subscriptionRepo.save(sub);
            await this.tenantRepo.update(sub.tenant_id, { status: tenant_entity_1.TenantStatus.PAST_DUE });
            this.logger.warn(`⚠️  Tenant ${sub.tenant_id} marcado como PAST_DUE (suscripción vencida)`);
        }
        const cancelledExpired = await this.subscriptionRepo.find({
            where: {
                status: subscription_entity_1.SubscriptionStatus.CANCELLED,
                end_date: (0, typeorm_2.LessThan)(today),
            },
        });
        for (const sub of cancelledExpired) {
            sub.status = subscription_entity_1.SubscriptionStatus.SUSPENDED;
            await this.subscriptionRepo.save(sub);
            await this.tenantRepo.update(sub.tenant_id, { status: tenant_entity_1.TenantStatus.SUSPENDED });
            this.logger.warn(`🔒 Tenant ${sub.tenant_id} SUSPENDIDO (cancelado y período pago expirado)`);
        }
        const soon = new Date();
        soon.setDate(soon.getDate() + 5);
        const expiringSoon = await this.subscriptionRepo.count({
            where: {
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                end_date: (0, typeorm_2.Between)(today, soon),
            },
        });
        if (expiringSoon > 0) {
            this.logger.log(`📧 ${expiringSoon} suscripciones vencen en los próximos 5 días`);
        }
        await this.handlePromoTransitions();
    }
    async handlePromoTransitions() {
        const today = new Date();
        const transitions = await this.subscriptionRepo.find({
            where: {
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                promo_ends_at: (0, typeorm_2.LessThanOrEqual)(today),
            },
        });
        if (transitions.length === 0)
            return;
        this.logger.log(`🔄 Procesando ${transitions.length} transiciones de precio promo -> normal`);
        for (const sub of transitions) {
            const oldPrice = sub.locked_price;
            const newPrice = sub.price_after_promo;
            if (!newPrice) {
                sub.promotion_id = null;
                sub.promo_ends_at = null;
                await this.subscriptionRepo.save(sub);
                continue;
            }
            this.logger.log(`   - Tenant ${sub.tenant_id}: $${oldPrice} -> $${newPrice}`);
            sub.locked_price = newPrice;
            sub.promotion_id = null;
            sub.promo_ends_at = null;
            sub.price_after_promo = null;
            if (sub.mp_preapproval_id) {
                try {
                    const preApprovalClient = new mercadopago_1.PreApproval(this.mp);
                    await preApprovalClient.update({
                        id: sub.mp_preapproval_id,
                        body: {
                            auto_recurring: {
                                transaction_amount: Number(newPrice),
                            },
                        },
                    });
                    this.logger.log(`     ✅ MercadoPago actualizado a $${newPrice}`);
                }
                catch (err) {
                    this.logger.error(`     ❌ Error actualizando MercadoPago para tenant ${sub.tenant_id}:`, err);
                }
            }
            await this.subscriptionRepo.save(sub);
        }
    }
    calculateProration(fullPrice, subscriptionDate) {
        const billingDay = 10;
        const subDate = new Date(subscriptionDate);
        let nextBillingDate;
        if (subDate.getDate() <= billingDay) {
            nextBillingDate = new Date(subDate.getFullYear(), subDate.getMonth(), billingDay);
        }
        else {
            nextBillingDate = new Date(subDate.getFullYear(), subDate.getMonth() + 1, billingDay);
        }
        const diffMs = nextBillingDate.getTime() - subDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const dailyRate = fullPrice / 30;
        const prorated_amount = Math.round(dailyRate * diffDays * 100) / 100;
        return { prorated_amount, first_end_date: nextBillingDate };
    }
};
exports.BillingService = BillingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingService.prototype, "checkExpiringSubscriptions", null);
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __param(1, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(2, (0, typeorm_1.InjectRepository)(billing_history_entity_1.BillingHistory)),
    __param(3, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], BillingService);
//# sourceMappingURL=billing.service.js.map