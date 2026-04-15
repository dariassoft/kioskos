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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const get_tenant_decorator_1 = require("../common/decorators/get-tenant.decorator");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    getDashboardMetrics(tenantId, branchId) {
        return this.reportsService.getDashboardMetrics(tenantId, branchId);
    }
    getWeeklyChart(tenantId, branchId) {
        return this.reportsService.getWeeklySalesChart(tenantId, branchId);
    }
    getTopProducts(tenantId, branchId) {
        return this.reportsService.getTopSellingProducts(tenantId, branchId);
    }
    getInventoryValuation(tenantId, branchId) {
        return this.reportsService.getInventoryValuation(tenantId, branchId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Métricas macro del Dashboard principal' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', type: String, required: false }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDashboardMetrics", null);
__decorate([
    (0, common_1.Get)('chart/weekly'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Gráfico de barras: Últimos 7 días' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', type: String, required: false }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getWeeklyChart", null);
__decorate([
    (0, common_1.Get)('chart/top-products'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Ranking: Productos más vendidos (Pie Chart)' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', type: String, required: false }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getTopProducts", null);
__decorate([
    (0, common_1.Get)('inventory-valuation'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'KPI: Capital inmovilizado en stock real' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', type: String, required: false }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getInventoryValuation", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map