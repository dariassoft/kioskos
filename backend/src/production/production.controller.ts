import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { RequiresFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  CreateProductionOrderDto,
} from './dto/production.dto';

@ApiTags('production')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@Controller('production')
@RequiresFeature('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  // ==========================================
  // RECETAS
  // ==========================================

  @Get('recipes')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar recetas de producción (fraccionamiento y elaboración)' })
  findAllRecipes(@GetTenantId() tenantId: string) {
    return this.productionService.findAllRecipes(tenantId);
  }

  @Get('recipes/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Ver detalle de una receta' })
  findOneRecipe(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.productionService.findOneRecipe(id, tenantId);
  }

  @Post('recipes')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear receta (define insumos aproximados por tanda)' })
  createRecipe(@Body() dto: CreateRecipeDto, @GetTenantId() tenantId: string) {
    return this.productionService.createRecipe(dto, tenantId);
  }

  @Patch('recipes/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar receta' })
  updateRecipe(
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.productionService.updateRecipe(id, dto, tenantId);
  }

  @Delete('recipes/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar receta (soft delete)' })
  deleteRecipe(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.productionService.deleteRecipe(id, tenantId);
  }

  @Get('requirements')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Cálculo estimado de insumos para producir X cantidad (seguimiento calculado)' })
  @ApiQuery({ name: 'output_product_id', required: true })
  @ApiQuery({ name: 'quantity', required: true })
  calculateRequirements(
    @GetTenantId() tenantId: string,
    @Query('output_product_id') outputProductId: string,
    @Query('quantity') quantity: number,
  ) {
    return this.productionService.calculateRequirements(outputProductId, Number(quantity), tenantId);
  }

  // ==========================================
  // ÓRDENES DE PRODUCCIÓN
  // ==========================================

  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Historial de producciones' })
  @ApiQuery({ name: 'branch_id', required: false })
  findAllOrders(@GetTenantId() tenantId: string, @Query('branch_id') branchId?: string) {
    return this.productionService.findAllOrders(tenantId, branchId);
  }

  @Get('orders/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Ver detalle de una orden de producción' })
  findOneOrder(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.productionService.findOneOrder(id, tenantId);
  }

  @Post('orders')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Registrar producción: descuenta insumos e incrementa productos obtenidos' })
  createOrder(@Body() dto: CreateProductionOrderDto, @GetTenantId() tenantId: string) {
    return this.productionService.createOrder(dto, tenantId);
  }

  @Post('orders/:id/cancel')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancelar producción y revertir el stock' })
  cancelOrder(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.productionService.cancelOrder(id, tenantId);
  }
}
