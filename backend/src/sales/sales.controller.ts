import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { SalesService } from './sales.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles, UserRole } from '@common/decorators/roles.decorator';
import { GetTenantId } from '@common/decorators/get-tenant.decorator';

import {
  CreateSaleDto,
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  ListSalesQueryDto,
} from './dto/sales.dto';

@ApiTags('sales')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ==========================================
  // CAJA REGISTRADORA
  // ==========================================

  @Get('cash-register/active')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener la caja abierta actual en una sucursal para el usuario logueado' })
  @ApiQuery({ name: 'branch_id', required: true })
  getActiveRegister(
    @GetTenantId() tenantId: string,
    @Query('branch_id') branchId: string,
    @Request() req: any,
  ) {
    return this.salesService.getActiveRegister(tenantId, branchId, req.user.id);
  }

  @Post('cash-register/open')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Abrir turno en la caja de una sucursal' })
  openCashRegister(
    @Body() dto: OpenCashRegisterDto,
    @GetTenantId() tenantId: string,
    @Request() req: any,
  ) {
    return this.salesService.openCashRegister(dto, tenantId, req.user.id);
  }

  @Post('cash-register/close')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Cerrar el turno de caja activa en una sucursal' })
  @ApiQuery({ name: 'branch_id', required: true })
  closeCashRegister(
    @Query('branch_id') branchId: string,
    @Body() dto: CloseCashRegisterDto,
    @GetTenantId() tenantId: string,
    @Request() req: any,
  ) {
    return this.salesService.closeCashRegister(branchId, dto, tenantId, req.user.id);
  }

  // ==========================================
  // VENTAS (POS)
  // ==========================================

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar ventas del negocio con filtros de estado y fecha' })
  listSales(
    @GetTenantId() tenantId: string,
    @Query() query: ListSalesQueryDto,
  ) {
    return this.salesService.listSales(tenantId, query);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Registrar una nueva venta y descontar stock' })
  createSale(
    @Body() dto: CreateSaleDto,
    @GetTenantId() tenantId: string,
    @Request() req: any,
  ) {
    return this.salesService.createSale(dto, tenantId, req.user.id);
  }

  @Patch(':id/verify-payment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Marcar como confirmado un pago pendiente (transferencia, QR o link)' })
  verifySalePayment(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.salesService.verifySale(id, tenantId);
  }

  // ==========================================
  // CLIENTES (Customers / Fiados)
  // ==========================================

  @Get('customers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar todos los clientes del negocio' })
  findAllCustomers(@GetTenantId() tenantId: string) {
    return this.salesService.findAllCustomers(tenantId);
  }

  @Post('customers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Registrar un nuevo cliente para el sistema de fiados' })
  createCustomer(
    @Body() dto: CreateCustomerDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.salesService.createCustomer(dto, tenantId);
  }

  @Patch('customers/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar la información de un cliente o límite de crédito' })
  updateCustomer(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.salesService.updateCustomer(id, dto, tenantId);
  }

  @Post('customers/:id/pay')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Registrar el abono/pago de la deuda de cuenta corriente' })
  payDebt(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @GetTenantId() tenantId: string,
  ) {
    return this.salesService.payDebt(id, amount, tenantId);
  }
}
