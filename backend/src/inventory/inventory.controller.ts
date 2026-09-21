import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import {
  CreateProductDto, UpdateProductDto, SetPriceDto,
  UpdateStockDto, CreateBranchDto, CreateCategoryDto,
  CreateUnitDto, ProductQueryDto, BulkUpdatePriceDto,
  CreateBrandDto, TransferStockDto,
} from './dto/inventory.dto';

@ApiTags('inventory')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==========================================
  // PRODUCTOS
  // ==========================================

  @Get('products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar productos con filtros y paginación' })
  findAllProducts(@GetTenantId() tenantId: string, @Query() query: ProductQueryDto) {
    return this.inventoryService.findAllProducts(tenantId, query);
  }

  @Get('products/search')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiQuery({ name: 'branch_id', required: false, description: 'ID de la sucursal para obtener stock actual en los resultados' })
  quickSearch(
    @GetTenantId() tenantId: string, 
    @Query('q') q: string,
    @Query('branch_id') branchId?: string,
  ) {
    return this.inventoryService.quickSearch(q || '', tenantId, branchId);
  }

  @Get('products/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Ver detalle de un producto' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.inventoryService.findOneProduct(id, tenantId);
  }

  @Post('products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear producto' })
  createProduct(@Body() dto: CreateProductDto, @GetTenantId() tenantId: string) {
    return this.inventoryService.createProduct(dto, tenantId);
  }

  @Patch('products/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar producto' })
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.inventoryService.updateProduct(id, dto, tenantId);
  }

  @Delete('products/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar producto (soft delete)' })
  deleteProduct(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.inventoryService.deleteProduct(id, tenantId);
  }

  @Post('products/:id/image')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Subir imagen para un producto' })
  async uploadProductImage(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = `/uploads/${file.filename}`;
    return this.inventoryService.updateProduct(id, { image_url: imageUrl }, tenantId);
  }

  // ==========================================
  // PRECIOS
  // ==========================================

  @Post('products/:id/prices')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Establecer precio para una lista de precios' })
  setPrice(
    @Param('id') productId: string,
    @Body() dto: SetPriceDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.inventoryService.setProductPrice(productId, dto, tenantId);
  }

  @Post('prices/bulk-update')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualización masiva de precios' })
  bulkUpdatePrices(
    @Body() dto: BulkUpdatePriceDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.inventoryService.bulkUpdatePrices(dto, tenantId);
  }

  // ==========================================
  // STOCK
  // ==========================================

  @Get('stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Ver stock de una sucursal' })
  @ApiQuery({ name: 'branch_id', required: true })
  getStock(@GetTenantId() tenantId: string, @Query('branch_id') branchId: string) {
    return this.inventoryService.getInventoryByBranch(tenantId, branchId);
  }

  @Get('stock/low')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Productos con stock por debajo del mínimo' })
  getLowStock(@GetTenantId() tenantId: string) {
    return this.inventoryService.getLowStockItems(tenantId);
  }

  @Get('stock/replenishment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lista de reposición (productos bajo el mínimo)' })
  @ApiQuery({ name: 'branch_id', required: false })
  getReplenishment(@GetTenantId() tenantId: string, @Query('branch_id') branchId?: string) {
    return this.inventoryService.getReplenishmentList(tenantId, branchId);
  }

  @Post('stock/adjust')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Ajustar stock (bajas por robo, rotura, etc.)' })
  adjustStock(
    @GetTenantId() tenantId: string,
    @Body() dto: { product_id: string; branch_id: string; quantity: number; reason: string },
  ) {
    return this.inventoryService.adjustStock(dto, tenantId);
  }

  @Post('stock/transfer')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Transferir stock entre sucursales' })
  transferStock(
    @GetTenantId() tenantId: string,
    @Body() dto: TransferStockDto,
  ) {
    return this.inventoryService.transferStock(dto, tenantId);
  }

  @Post('products/:id/stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Agregar stock a un producto en una sucursal' })
  addStock(
    @Param('id') productId: string,
    @Body() dto: UpdateStockDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.inventoryService.addStock(dto, productId, tenantId);
  }

  // ==========================================
  // SUCURSALES
  // ==========================================

  @Get('branches')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar sucursales del negocio' })
  findBranches(@GetTenantId() tenantId: string) {
    return this.inventoryService.findAllBranches(tenantId);
  }

  @Post('branches')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear sucursal' })
  createBranch(@Body() dto: CreateBranchDto, @GetTenantId() tenantId: string) {
    return this.inventoryService.createBranch(dto, tenantId);
  }

  @Patch('branches/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar sucursal' })
  updateBranch(
    @Param('id') id: string,
    @Body() dto: CreateBranchDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.inventoryService.updateBranch(id, dto, tenantId);
  }

  // ==========================================
  // CATEGORÍAS
  // ==========================================

  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar categorías' })
  findCategories(@GetTenantId() tenantId: string) {
    return this.inventoryService.findAllCategories(tenantId);
  }

  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear categoría' })
  createCategory(@Body() dto: CreateCategoryDto, @GetTenantId() tenantId: string) {
    return this.inventoryService.createCategory(dto, tenantId);
  }

  @Patch('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar categoría' })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
    @GetTenantId() tenantId: string,
  ) {
    return this.inventoryService.updateCategory(id, dto, tenantId);
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar categoría (desvincula productos)' })
  deleteCategory(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.inventoryService.deleteCategory(id, tenantId);
  }

  @Get('brands')
  @ApiOperation({ summary: 'Listado de marcas' })
  findAllBrands(@GetTenantId() tenantId: string) {
    return this.inventoryService.findAllBrands(tenantId);
  }

  @Post('brands')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear nueva marca' })
  createBrand(@Body() dto: CreateBrandDto, @GetTenantId() tenantId: string) {
    return this.inventoryService.createBrand(dto, tenantId);
  }

  @Patch('brands/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar marca' })
  updateBrand(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBrandDto>,
    @GetTenantId() tenantId: string,
  ) {
    return this.inventoryService.updateBrand(id, dto, tenantId);
  }

  @Delete('brands/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar marca (desvincula productos)' })
  deleteBrand(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.inventoryService.deleteBrand(id, tenantId);
  }

  // ==========================================
  // UNIDADES DE MEDIDA
  // ==========================================

  @Get('units')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar unidades de medida' })
  findUnits(@GetTenantId() tenantId: string) {
    return this.inventoryService.findAllUnits(tenantId);
  }

  @Post('units')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear unidad de medida' })
  createUnit(@Body() dto: CreateUnitDto, @GetTenantId() tenantId: string) {
    return this.inventoryService.createUnit(dto, tenantId);
  }

  @Patch('units/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar unidad de medida' })
  updateUnit(
    @Param('id') id: string,
    @Body() dto: Partial<CreateUnitDto>,
    @GetTenantId() tenantId: string,
  ) {
    return this.inventoryService.updateUnit(id, dto, tenantId);
  }

  @Delete('units/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar unidad de medida (desvincula productos)' })
  deleteUnit(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.inventoryService.deleteUnit(id, tenantId);
  }

  // ==========================================
  // LISTAS DE PRECIOS
  // ==========================================

  @Get('price-lists')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar listas de precios' })
  findPriceLists(@GetTenantId() tenantId: string) {
    return this.inventoryService.findAllPriceLists(tenantId);
  }

  @Post('price-lists')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear lista de precios' })
  createPriceList(
    @Body() body: { name: string; is_default?: boolean },
    @GetTenantId() tenantId: string,
  ) {
    return this.inventoryService.createPriceList(body.name, tenantId, body.is_default);
  }
}
