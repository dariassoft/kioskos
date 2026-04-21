"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
let BillingService = class BillingService {
    constructor(planRepo, subscriptionRepo, billingRepo, tenantRepo) {
        this.planRepo = planRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.billingRepo = billingRepo;
        this.tenantRepo = tenantRepo;
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
        const today = new Date();
        return this.subscriptionRepo.findOne({
            where: { tenant_id: tenantId, end_date: (0, typeorm_2.MoreThan)(today) },
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
            return { ...sub, tenant, plan, days_left: daysLeft, is_expired: daysLeft < 0 };
        }));
        return results;
    }
    async changePlan(dto) {
        const plan = await this.planRepo.findOne({ where: { id: dto.new_plan_id } });
        if (!plan)
            throw new common_1.NotFoundException('Plan no encontrado');
        let subscription = await this.getActiveSubscription(dto.tenant_id);
        const today = new Date();
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 1);
        if (subscription) {
            subscription.plan_id = dto.new_plan_id;
            subscription.start_date = today;
            subscription.end_date = endDate;
        }
        else {
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
    async isFeatureEnabled(tenantId, feature) {
        const subscription = await this.getActiveSubscription(tenantId);
        if (!subscription)
            return false;
        const plan = await this.planRepo.findOne({ where: { id: subscription.plan_id } });
        if (!plan || !plan.features)
            return false;
        return plan.features[feature] === true;
    }
    async registerPayment(dto) {
        const tenant = await this.tenantRepo.findOne({ where: { id: dto.tenant_id } });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant no encontrado');
        const months = dto.months ?? 1;
        const payment = this.billingRepo.create({
            tenant_id: dto.tenant_id,
            amount: dto.amount,
            payment_status: billing_history_entity_1.PaymentStatus.PAID,
            payment_method: dto.payment_method,
            invoice_url: dto.notes ?? undefined,
        });
        await this.billingRepo.save(payment);
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
        }
        else {
            const basicPlan = await this.planRepo.findOne({ where: { is_active: true }, order: { price_monthly: 'ASC' } });
            if (!basicPlan)
                throw new common_1.BadRequestException('No hay planes disponibles');
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
        if (tenant.status !== tenant_entity_1.TenantStatus.ACTIVE) {
            await this.tenantRepo.update(tenant.id, { status: tenant_entity_1.TenantStatus.ACTIVE });
        }
        return payment;
    }
    async getAllBillingHistory(tenantId) {
        const where = {};
        if (tenantId)
            where.tenant_id = tenantId;
        const history = await this.billingRepo.find({
            where,
            order: { created_at: 'DESC' },
        });
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
            const today = new Date();
            const activeSubscriptions = await this.subscriptionRepo.find({
                where: { end_date: (0, typeorm_2.MoreThan)(today) },
            });
            let mrr = 0;
            for (const sub of activeSubscriptions) {
                const plan = await this.planRepo.findOne({ where: { id: sub.plan_id } });
                if (plan)
                    mrr += Number(plan.price_monthly);
            }
            const soon = new Date();
            soon.setDate(soon.getDate() + 7);
            const expiringSoon = await this.subscriptionRepo.count({
                where: { end_date: (0, typeorm_2.Between)(today, soon) },
            });
            const totalTenants = await this.tenantRepo.count();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            const revenueRaw = await this.billingRepo
                .createQueryBuilder('bh')
                .select("DATE_FORMAT(bh.created_at, '%Y-%m') AS month")
                .addSelect('SUM(bh.amount) AS revenue')
                .where('bh.created_at >= :from', { from: sixMonthsAgo })
                .andWhere('bh.payment_status = :status', { status: billing_history_entity_1.PaymentStatus.PAID })
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
        catch (error) {
            console.error('[BillingService] Error fetching MRR metrics:', error);
            return {
                mrr: 0,
                total_active: 0,
                total_tenants: 0,
                expiring_soon: 0,
                monthly_revenue: [],
            };
        }
    }
    async getExpiringSubscriptions(days = 7) {
        const today = new Date();
        const limit = new Date();
        limit.setDate(limit.getDate() + days);
        const subs = await this.subscriptionRepo.find({
            where: { end_date: (0, typeorm_2.Between)(today, limit) },
        });
        return Promise.all(subs.map(async (sub) => {
            const tenant = await this.tenantRepo.findOne({ where: { id: sub.tenant_id } });
            const plan = await this.planRepo.findOne({ where: { id: sub.plan_id } });
            const daysLeft = Math.ceil((new Date(sub.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return { ...sub, tenant, plan, days_left: daysLeft };
        }));
    }
    async checkExpiringSubscriptions() {
        const expiring = await this.getExpiringSubscriptions(5);
        if (expiring.length > 0) {
            console.log(`[Billing] ⚠️  ${expiring.length} suscripciones vencen en los próximos 5 días`);
        }
    }
};
exports.BillingService = BillingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingService.prototype, "checkExpiringSubscriptions", null);
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __param(1, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(2, (0, typeorm_1.InjectRepository)(billing_history_entity_1.BillingHistory)),
    __param(3, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BillingService);
//# sourceMappingURL=billing.service.js.map