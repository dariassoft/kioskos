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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const sales_service_1 = require("./sales.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const get_tenant_decorator_1 = require("../common/decorators/get-tenant.decorator");
const sales_dto_1 = require("./dto/sales.dto");
const payment_account_dto_1 = require("./dto/payment-account.dto");
let SalesController = class SalesController {
    constructor(salesService) {
        this.salesService = salesService;
    }
    getActiveRegister(tenantId, branchId, req) {
        return this.salesService.getActiveRegister(tenantId, branchId, req.user.id);
    }
    openCashRegister(dto, tenantId, req) {
        return this.salesService.openCashRegister(dto, tenantId, req.user.id);
    }
    closeCashRegister(branchId, dto, tenantId, req) {
        return this.salesService.closeCashRegister(branchId, dto, tenantId, req.user.id);
    }
    listSales(tenantId, query) {
        return this.salesService.listSales(tenantId, query);
    }
    createSale(dto, tenantId, req) {
        return this.salesService.createSale(dto, tenantId, req.user.id);
    }
    verifySalePayment(id, tenantId) {
        return this.salesService.verifySale(id, tenantId);
    }
    revertSalePayment(id, tenantId) {
        return this.salesService.revertSalePayment(id, tenantId);
    }
    async uploadVoucher(id, tenantId, file) {
        const imageUrl = `/uploads/${file.filename}`;
        return this.salesService.uploadVoucher(id, imageUrl, tenantId);
    }
    findAllCustomers(tenantId) {
        return this.salesService.findAllCustomers(tenantId);
    }
    createCustomer(dto, tenantId) {
        return this.salesService.createCustomer(dto, tenantId);
    }
    updateCustomer(id, dto, tenantId) {
        return this.salesService.updateCustomer(id, dto, tenantId);
    }
    payDebt(id, amount, tenantId) {
        return this.salesService.payDebt(id, amount, tenantId);
    }
    findAllPaymentAccounts(tenantId) {
        return this.salesService.findAllPaymentAccounts(tenantId);
    }
    createPaymentAccount(dto, tenantId) {
        return this.salesService.createPaymentAccount(dto, tenantId);
    }
    updatePaymentAccount(id, dto, tenantId) {
        return this.salesService.updatePaymentAccount(id, dto, tenantId);
    }
    deletePaymentAccount(id, tenantId) {
        return this.salesService.deletePaymentAccount(id, tenantId);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Get)('cash-register/active'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener la caja abierta actual en una sucursal para el usuario logueado' }),
    (0, swagger_1.ApiQuery)({ name: 'branch_id', required: true }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)('branch_id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getActiveRegister", null);
__decorate([
    (0, common_1.Post)('cash-register/open'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Abrir turno en la caja de una sucursal' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_dto_1.OpenCashRegisterDto, String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "openCashRegister", null);
__decorate([
    (0, common_1.Post)('cash-register/close'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Cerrar el turno de caja activa en una sucursal' }),
    (0, swagger_1.ApiQuery)({ name: 'branch_id', required: true }),
    __param(0, (0, common_1.Query)('branch_id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_dto_1.CloseCashRegisterDto, String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "closeCashRegister", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar ventas del negocio con filtros de estado y fecha' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_dto_1.ListSalesQueryDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "listSales", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar una nueva venta y descontar stock' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_dto_1.CreateSaleDto, String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "createSale", null);
__decorate([
    (0, common_1.Patch)(':id/verify-payment'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar como confirmado un pago pendiente (transferencia, QR o link)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "verifySalePayment", null);
__decorate([
    (0, common_1.Patch)(':id/revert-payment'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Revierte un pago verificado a PENDING (administrativo)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "revertSalePayment", null);
__decorate([
    (0, common_1.Post)(':id/voucher'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Subir imagen del comprobante de transferencia' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "uploadVoucher", null);
__decorate([
    (0, common_1.Get)('customers'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos los clientes del negocio' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAllCustomers", null);
__decorate([
    (0, common_1.Post)('customers'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar un nuevo cliente para el sistema de fiados' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_dto_1.CreateCustomerDto, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "createCustomer", null);
__decorate([
    (0, common_1.Patch)('customers/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar la información de un cliente o límite de crédito' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_dto_1.UpdateCustomerDto, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "updateCustomer", null);
__decorate([
    (0, common_1.Post)('customers/:id/pay'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar el abono/pago de la deuda de cuenta corriente' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('amount')),
    __param(2, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "payDebt", null);
__decorate([
    (0, common_1.Get)('payment-accounts'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar cuentas de cobro (CBU/Alias)' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAllPaymentAccounts", null);
__decorate([
    (0, common_1.Post)('payment-accounts'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Crear nueva cuenta de cobro' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_account_dto_1.CreatePaymentAccountDto, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "createPaymentAccount", null);
__decorate([
    (0, common_1.Patch)('payment-accounts/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar cuenta de cobro' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_account_dto_1.UpdatePaymentAccountDto, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "updatePaymentAccount", null);
__decorate([
    (0, common_1.Delete)('payment-accounts/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar cuenta de cobro' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "deletePaymentAccount", null);
exports.SalesController = SalesController = __decorate([
    (0, swagger_1.ApiTags)('sales'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map