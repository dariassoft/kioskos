import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { RequiresFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';

import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  CreatePurchasePaymentDto,
  CreatePurchaseReturnDto,
  SupplierCurrentAccountsQueryDto,
} from './dto/purchases.dto';

@ApiTags('purchases')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@Controller('purchases')
@RequiresFeature('purchases_suppliers')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  // ==========================================
  // PROVEEDORES
  // ==========================================

  @Get('suppliers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar todos los proveedores' })
  findAllSuppliers(@GetTenantId() tenantId: string) {
    return this.purchasesService.findAllSuppliers(tenantId);
  }

  @Post('suppliers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear un nuevo proveedor' })
  createSupplier(
    @Body() dto: CreateSupplierDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.purchasesService.createSupplier(dto, tenantId);
  }

  @Patch('suppliers/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar un proveedor' })
  updateSupplier(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.purchasesService.updateSupplier(id, dto, tenantId);
  }

  @Delete('suppliers/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un proveedor' })
  removeSupplier(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.purchasesService.removeSupplier(id, tenantId);
  }

  // ==========================================
  // ÓRDENES DE COMPRA
  // ==========================================

  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar todas las órdenes de compra' })
  findAllOrders(@GetTenantId() tenantId: string) {
    return this.purchasesService.findAllOrders(tenantId);
  }

  @Post('orders')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear una orden de compra pendiente' })
  createOrder(
    @Body() dto: CreatePurchaseOrderDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.purchasesService.createOrder(dto, tenantId);
  }

  @Patch('orders/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Editar una orden de compra pendiente' })
  updateOrder(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.purchasesService.updateOrder(id, dto, tenantId);
  }

  @Post('orders/:id/receive')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Marcar orden como recibida e ingresar stock' })
  receiveOrder(
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.purchasesService.receiveOrder(id, tenantId, dto);
  }

  @Post('orders/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Cancelar orden de compra' })
  cancelOrder(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.purchasesService.cancelOrder(id, tenantId);
  }

  @Get('orders/:id/payments')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listPayments(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.purchasesService.listPayments(id, tenantId);
  }

  @Post('orders/:id/payments')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createPayment(@Param('id') id: string, @Body() dto: CreatePurchasePaymentDto, @GetTenantId() tenantId: string) {
    return this.purchasesService.createPayment(id, dto, tenantId);
  }

  @Post('orders/:id/returns')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Registrar devolución parcial o total de mercadería al proveedor' })
  createReturn(@Param('id') id: string, @Body() dto: CreatePurchaseReturnDto, @GetTenantId() tenantId: string) {
    return this.purchasesService.createReturn(id, dto, tenantId);
  }

  @Get('suppliers/:id/current-account')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Consultar cuenta corriente de un proveedor' })
  getSupplierAccount(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.purchasesService.getSupplierAccount(id, tenantId);
  }

  @Get('suppliers/current-accounts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar cuentas corrientes habilitadas de proveedores' })
  findSupplierAccounts(
    @Query() query: SupplierCurrentAccountsQueryDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.purchasesService.findSupplierAccounts(query, tenantId);
  }
}
