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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const inventory_service_1 = require("./inventory.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const get_tenant_decorator_1 = require("../common/decorators/get-tenant.decorator");
const inventory_dto_1 = require("./dto/inventory.dto");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    findAllProducts(tenantId, query) {
        return this.inventoryService.findAllProducts(tenantId, query);
    }
    quickSearch(tenantId, q) {
        return this.inventoryService.quickSearch(q || '', tenantId);
    }
    findOne(id, tenantId) {
        return this.inventoryService.findOneProduct(id, tenantId);
    }
    createProduct(dto, tenantId) {
        return this.inventoryService.createProduct(dto, tenantId);
    }
    updateProduct(id, dto, tenantId) {
        return this.inventoryService.updateProduct(id, dto, tenantId);
    }
    deleteProduct(id, tenantId) {
        return this.inventoryService.deleteProduct(id, tenantId);
    }
    async uploadProductImage(id, tenantId, file) {
        const imageUrl = `/uploads/${file.filename}`;
        return this.inventoryService.updateProduct(id, { image_url: imageUrl }, tenantId);
    }
    setPrice(productId, dto, tenantId) {
        return this.inventoryService.setProductPrice(productId, dto, tenantId);
    }
    bulkUpdatePrices(dto, tenantId) {
        return this.inventoryService.bulkUpdatePrices(dto, tenantId);
    }
    getStock(tenantId, branchId) {
        return this.inventoryService.getInventoryByBranch(tenantId, branchId);
    }
    getLowStock(tenantId) {
        return this.inventoryService.getLowStockItems(tenantId);
    }
    getReplenishment(tenantId, branchId) {
        return this.inventoryService.getReplenishmentList(tenantId, branchId);
    }
    adjustStock(tenantId, dto) {
        return this.inventoryService.adjustStock(dto, tenantId);
    }
    addStock(productId, dto, tenantId) {
        return this.inventoryService.addStock(dto, productId, tenantId);
    }
    findBranches(tenantId) {
        return this.inventoryService.findAllBranches(tenantId);
    }
    createBranch(dto, tenantId) {
        return this.inventoryService.createBranch(dto, tenantId);
    }
    updateBranch(id, dto, tenantId) {
        return this.inventoryService.updateBranch(id, dto, tenantId);
    }
    findCategories(tenantId) {
        return this.inventoryService.findAllCategories(tenantId);
    }
    createCategory(dto, tenantId) {
        return this.inventoryService.createCategory(dto, tenantId);
    }
    findAllBrands(tenantId) {
        return this.inventoryService.findAllBrands(tenantId);
    }
    createBrand(dto, tenantId) {
        return this.inventoryService.createBrand(dto, tenantId);
    }
    findUnits(tenantId) {
        return this.inventoryService.findAllUnits(tenantId);
    }
    createUnit(dto, tenantId) {
        return this.inventoryService.createUnit(dto, tenantId);
    }
    findPriceLists(tenantId) {
        return this.inventoryService.findAllPriceLists(tenantId);
    }
    createPriceList(body, tenantId) {
        return this.inventoryService.createPriceList(body.name, tenantId, body.is_default);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('products'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar productos con filtros y paginación' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.ProductQueryDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "findAllProducts", null);
__decorate([
    (0, common_1.Get)('products/search'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Búsqueda rápida de productos (para POS)' }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'Nombre, código de barras o código interno' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "quickSearch", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Ver detalle de un producto' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('products'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Crear producto' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateProductDto, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Patch)('products/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar producto' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateProductDto, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)('products/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Desactivar producto (soft delete)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Post)('products/:id/image'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Subir imagen para un producto' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "uploadProductImage", null);
__decorate([
    (0, common_1.Post)('products/:id/prices'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Establecer precio para una lista de precios' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.SetPriceDto, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "setPrice", null);
__decorate([
    (0, common_1.Post)('prices/bulk-update'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Actualización masiva de precios' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.BulkUpdatePriceDto, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "bulkUpdatePrices", null);
__decorate([
    (0, common_1.Get)('stock'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Ver stock de una sucursal' }),
    (0, swagger_1.ApiQuery)({ name: 'branch_id', required: true }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)('branch_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getStock", null);
__decorate([
    (0, common_1.Get)('stock/low'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Productos con stock por debajo del mínimo' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getLowStock", null);
__decorate([
    (0, common_1.Get)('stock/replenishment'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Lista de reposición (productos bajo el mínimo)' }),
    (0, swagger_1.ApiQuery)({ name: 'branch_id', required: false }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)('branch_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getReplenishment", null);
__decorate([
    (0, common_1.Post)('stock/adjust'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Ajustar stock (bajas por robo, rotura, etc.)' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Post)('products/:id/stock'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Agregar stock a un producto en una sucursal' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateStockDto, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "addStock", null);
__decorate([
    (0, common_1.Get)('branches'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar sucursales del negocio' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "findBranches", null);
__decorate([
    (0, common_1.Post)('branches'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Crear sucursal' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateBranchDto, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createBranch", null);
__decorate([
    (0, common_1.Patch)('branches/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar sucursal' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.CreateBranchDto, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updateBranch", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar categorías' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "findCategories", null);
__decorate([
    (0, common_1.Post)('categories'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Crear categoría' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateCategoryDto, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Get)('brands'),
    (0, swagger_1.ApiOperation)({ summary: 'Listado de marcas' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "findAllBrands", null);
__decorate([
    (0, common_1.Post)('brands'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Crear nueva marca' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateBrandDto, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createBrand", null);
__decorate([
    (0, common_1.Get)('units'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER, roles_decorator_1.UserRole.CASHIER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar unidades de medida' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "findUnits", null);
__decorate([
    (0, common_1.Post)('units'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Crear unidad de medida' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateUnitDto, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createUnit", null);
__decorate([
    (0, common_1.Get)('price-lists'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar listas de precios' }),
    __param(0, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "findPriceLists", null);
__decorate([
    (0, common_1.Post)('price-lists'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Crear lista de precios' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_tenant_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createPriceList", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('inventory'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map