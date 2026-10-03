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
exports.AccountingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const accounting_service_1 = require("./accounting.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const get_tenant_decorator_1 = require("../common/decorators/get-tenant.decorator");
const feature_decorator_1 = require("../common/decorators/feature.decorator");
const feature_guard_1 = require("../common/guards/feature.guard");
let AccountingController = class AccountingController {
    constructor(accountingService) {
        this.accountingService = accountingService;
    }
    getLedger(tenantId, startDate, endDate) {
        return this.accountingService.getLedgerByDates(tenantId, startDate, endDate);
    }
};
exports.AccountingController = AccountingController;
__decorate([
    (0, common_1.Get)('ledger'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener el libro mayor por rango de fechas' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', type: String, required: true, example: '2026-04-01' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', type: String, required: true, example: '2026-04-30' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getLedger", null);
exports.AccountingController = AccountingController = __decorate([
    (0, swagger_1.ApiTags)('accounting'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, feature_guard_1.FeatureGuard),
    (0, common_1.Controller)('accounting'),
    (0, feature_decorator_1.RequiresFeature)('automated_accounting'),
    __metadata("design:paramtypes", [accounting_service_1.AccountingService])
], AccountingController);
//# sourceMappingURL=accounting.controller.js.map