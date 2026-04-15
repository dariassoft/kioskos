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
let BillingService = class BillingService {
    constructor(planRepo, subscriptionRepo, billingRepo) {
        this.planRepo = planRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.billingRepo = billingRepo;
    }
    async getActivePlans() {
        return this.planRepo.find({ where: { is_active: true } });
    }
    async createPlan(data) {
        const plan = this.planRepo.create(data);
        return this.planRepo.save(plan);
    }
    async getActiveSubscription(tenantId) {
        const today = new Date();
        return this.subscriptionRepo.findOne({
            where: { tenant_id: tenantId, end_date: (0, typeorm_2.MoreThan)(today) },
        });
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
    async getMrr() {
        const activeSubscriptions = await this.subscriptionRepo
            .createQueryBuilder('sub')
            .innerJoin('sub.plan_id', 'plan')
            .where('sub.end_date > :today', { today: new Date() })
            .getMany();
        return {
            mrr: activeSubscriptions.length * 0,
            total_active: activeSubscriptions.length,
        };
    }
    async checkExpiringSubscriptions() {
        console.log('[BillingService] Verificando suscripciones por vencer...');
    }
    async getBillingHistory(tenantId) {
        return this.billingRepo.find({
            where: { tenant_id: tenantId },
            order: { created_at: 'DESC' },
        });
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BillingService);
//# sourceMappingURL=billing.service.js.map