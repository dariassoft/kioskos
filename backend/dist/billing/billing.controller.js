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
const promotion_service_1 = require("./promotion.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const superadmin_guard_1 = require("../common/guards/superadmin.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const get_tenant_decorator_1 = require("../common/decorators/get-tenant.decorator");
const billing_dto_1 = require("./dto/billing.dto");
let BillingController = class BillingController {
    constructor(billingService, promotionService) {
        this.billingService = billingService;
        this.promotionService = promotionService;
    }
    getMrr() {
        return this.billingService.getMrr();
    }
    getExpiring(days) {
        return this.billingService.getExpiringSubscriptions(days ? Number(days) : 7);
    }
    getUpcomingCharges(days) {
        return this.billingService.getUpcomingCharges(days ? Number(days) : 30);
    }
    getPlans() {
        return this.billingService.getAllPlans();
    }
    createPlan(dto) {
        return this.billingService.createPlan(dto);
    }
    updatePlan(id, dto) {
        return this.billingService.updatePlan(id, dto);
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
    changePlan(dto) {
        return this.billingService.changePlan(dto);
    }
    getMySubscription(tenantId) {
        return this.billingService.getActiveSubscription(tenantId);
    }
    cancelMySubscription(tenantId, body) {
        return this.billingService.cancelSubscription(tenantId, body.reason);
    }
    getMyBillingHistory(tenantId) {
        return this.billingService.getBillingHistory(tenantId);
    }
    getAllHistory(tenantId) {
        return this.billingService.getAllBillingHistory(tenantId);
    }
    getBillingHistory(tenantId) {
        return this.billingService.getBillingHistory(tenantId);
    }
    registerPayment(dto) {
        return this.billingService.registerPayment(dto);
    }
    getAllPromotions() {
        return this.promotionService.findAll();
    }
    createPromotion(body) {
        return this.promotionService.create(body);
    }
    updatePromotion(id, body) {
        return this.promotionService.update(id, body);
    }
    removePromotion(id) {
        return this.promotionService.remove(id);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)('metrics/mrr'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] MRR, suscripciones activas y gráfico de ingresos' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getMrr", null);
__decorate([
    (0, common_1.Get)('metrics/expiring'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Suscripciones próximas a vencer' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getExpiring", null);
__decorate([
    (0, common_1.Get)('upcoming-charges'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Cobros próximos con detalle de montos' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getUpcomingCharges", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Listar todos los planes' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Post)('plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Crear nuevo plan' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.CreatePlanDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Patch)('plans/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Actualizar un plan' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, billing_dto_1.UpdatePlanDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Patch)('plans/:id/toggle'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Activar/desactivar un plan' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "togglePlan", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Listar todas las suscripciones con detalles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getAllSubscriptions", null);
__decorate([
    (0, common_1.Get)('subscriptions/:tenantId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Ver suscripción activa de un tenant' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getSubscription", null);
__decorate([
    (0, common_1.Post)('subscriptions/change-plan'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Cambiar el plan de un tenant' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.ChangePlanAdminDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "changePlan", null);
__decorate([
    (0, common_1.Get)('my-subscription'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Ver mi suscripción activa' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getMySubscription", null);
__decorate([
    (0, common_1.Post)('my-subscription/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar mi suscripción (darse de baja)' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "cancelMySubscription", null);
__decorate([
    (0, common_1.Get)('my-billing-history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Ver mi historial de pagos' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getMyBillingHistory", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Historial completo de pagos (todos los tenants)' }),
    (0, swagger_1.ApiQuery)({ name: 'tenant_id', required: false }),
    __param(0, (0, common_1.Query)('tenant_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getAllHistory", null);
__decorate([
    (0, common_1.Get)('history/:tenantId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Historial de pagos de un tenant específico' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getBillingHistory", null);
__decorate([
    (0, common_1.Post)('payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Registrar pago manual (extiende suscripción)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.RegisterPaymentAdminDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "registerPayment", null);
__decorate([
    (0, common_1.Get)('promotions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Listar todas las promociones' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getAllPromotions", null);
__decorate([
    (0, common_1.Post)('promotions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Crear una promoción' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "createPromotion", null);
__decorate([
    (0, common_1.Patch)('promotions/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Actualizar una promoción' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "updatePromotion", null);
__decorate([
    (0, common_1.Delete)('promotions/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Eliminar una promoción' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "removePromotion", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)('billing'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService,
        promotion_service_1.PromotionService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map