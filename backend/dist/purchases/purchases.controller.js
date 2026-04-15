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
exports.PurchasesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const purchases_service_1 = require("./purchases.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const get_tenant_decorator_1 = require("../common/decorators/get-tenant.decorator");
const purchases_dto_1 = require("./dto/purchases.dto");
let PurchasesController = class PurchasesController {
    constructor(purchasesService) {
        this.purchasesService = purchasesService;
    }
    findAllSuppliers(tenantId) {
        return this.purchasesService.findAllSuppliers(tenantId);
    }
    createSupplier(dto, tenantId) {
        return this.purchasesService.createSupplier(dto, tenantId);
    }
    updateSupplier(id, dto, tenantId) {
        return this.purchasesService.updateSupplier(id, dto, tenantId);
    }
    findAllOrders(tenantId) {
        return this.purchasesService.findAllOrders(tenantId);
    }
    createOrder(dto, tenantId) {
        return this.purchasesService.createOrder(dto, tenantId);
    }
    receiveOrder(id, tenantId) {
        return this.purchasesService.receiveOrder(id, tenantId);
    }
    cancelOrder(id, tenantId) {
        return this.purchasesService.cancelOrder(id, tenantId);
    }
};
exports.PurchasesController = PurchasesController;
__decorate([
    (0, common_1.Get)('suppliers'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos los proveedores' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "findAllSuppliers", null);
__decorate([
    (0, common_1.Post)('suppliers'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un nuevo proveedor' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [purchases_dto_1.CreateSupplierDto, String]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "createSupplier", null);
__decorate([
    (0, common_1.Patch)('suppliers/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar un proveedor' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, purchases_dto_1.UpdateSupplierDto, String]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "updateSupplier", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas las órdenes de compra' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "findAllOrders", null);
__decorate([
    (0, common_1.Post)('orders'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Crear una orden de compra pendiente' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [purchases_dto_1.CreatePurchaseOrderDto, String]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/receive'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar orden como recibida e ingresar stock' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "receiveOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/cancel'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar orden de compra' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "cancelOrder", null);
exports.PurchasesController = PurchasesController = __decorate([
    (0, swagger_1.ApiTags)('purchases'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('purchases'),
    __metadata("design:paramtypes", [purchases_service_1.PurchasesService])
], PurchasesController);
//# sourceMappingURL=purchases.controller.js.map