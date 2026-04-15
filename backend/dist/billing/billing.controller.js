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
    getPlans() {
        return this.billingService.getActivePlans();
    }
    createPlan(body) {
        return this.billingService.createPlan(body);
    }
    getSubscription(tenantId) {
        return this.billingService.getActiveSubscription(tenantId);
    }
    getBillingHistory(tenantId) {
        return this.billingService.getBillingHistory(tenantId);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Listar planes activos' }),
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
    (0, common_1.Get)('subscriptions/:tenantId'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Ver suscripción activa de un tenant' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getSubscription", null);
__decorate([
    (0, common_1.Get)('history/:tenantId'),
    (0, swagger_1.ApiOperation)({ summary: '[SuperAdmin] Historial de cobros de un tenant' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getBillingHistory", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)('billing'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, superadmin_guard_1.SuperAdminGuard),
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map