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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const billing_service_1 = require("./billing.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const superadmin_guard_1 = require("../common/guards/superadmin.guard");
let BillingController = class BillingController {
    constructor(billingService) {
        this.billingService = billingService;
    }
    getMrr() {
        return this.billingService.getMrr();
    }
    getExpiring(days) {
        return this.billingService.getExpiringSubscriptions(days ? Number(days) : 7);
    }
    getPlans() {
        return this.billingService.getAllPlans();
    }
    createPlan(body) {
        return this.billingService.createPlan(body);
    }
    updatePlan(id, body) {
        return this.billingService.updatePlan(id, body);
    }
    togglePlan(id) {
        return this.billingService.togglePlanStatus(id);
    }
    getAllSubscriptions() {
        return this.billingService.getAllSubscriptionsWithDetails();
    }
    getSubscription(tenantId) {
        return this.billingService.getActiveSubscription(tenantId);
    }
    changePlan(body) {
        return this.billingService.changePlan(body);
    }
    getAllHistory(tenantId) {
        return this.billingService.getAllBillingHistory(tenantId);
    }
    getBillingHistory(tenantId) {
        return this.billingService.getBillingHistory(tenantId);
    }
    registerPayment(body) {
        return this.billingService.registerPayment(body);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)('metrics/mrr'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] MRR, suscripciones activas y gráfico de ingresos' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getMrr", null);
__decorate([
    (0, common_1.Get)('metrics/expiring'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Suscripciones próximas a vencer' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getExpiring", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Listar todos los planes' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Post)('plans'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Crear nuevo plan' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Patch)('plans/:id'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Actualizar un plan' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Patch)('plans/:id/toggle'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Activar/desactivar un plan' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "togglePlan", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Listar todas las suscripciones con detalles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getAllSubscriptions", null);
__decorate([
    (0, common_1.Get)('subscriptions/:tenantId'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Ver suscripción activa de un tenant' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getSubscription", null);
__decorate([
    (0, common_1.Post)('subscriptions/change-plan'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Cambiar el plan de un tenant' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "changePlan", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Historial completo de pagos (todos los tenants)' }),
    (0, swagger_1.ApiQuery)({ name: 'tenant_id', required: false }),
    __param(0, (0, common_1.Query)('tenant_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getAllHistory", null);
__decorate([
    (0, common_1.Get)('history/:tenantId'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Historial de pagos de un tenant específico' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getBillingHistory", null);
__decorate([
    (0, common_1.Post)('payments'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Registrar pago manual (extiende suscripción)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "registerPayment", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)('billing'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map