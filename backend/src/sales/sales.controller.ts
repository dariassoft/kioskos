import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
  Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { SalesService } from './sales.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles, UserRole } from '@common/decorators/roles.decorator';
import { GetTenantId } from '@common/decorators/get-tenant.decorator';
import { RequiresFeature } from '@common/decorators/feature.decorator';
import { FeatureGuard } from '@common/guards/feature.guard';

import {
  CreateSaleDto,
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateCustomerPaymentDto,
  CurrentAccountsQueryDto,
  ListSalesQueryDto,
  CreateSaleReturnDto,
} from './dto/sales.dto';

import { CreatePaymentAccountDto, UpdatePaymentAccountDto } from './dto/payment-account.dto';

@ApiTags('sales')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@Controller('sales')
@RequiresFeature('pos_terminal')
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

  @Post(':id/returns')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Registrar devolución parcial o anulación total de una venta' })
  createReturn(@Param('id') id: string, @Body() dto: CreateSaleReturnDto, @GetTenantId() tenantId: string) {
    return this.salesService.createReturn(id, dto, tenantId);
  }

  @Patch(':id/verify-payment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER) // El cajero ahora puede confirmar si ve el comprobante
  @ApiOperation({ summary: 'Marcar como confirmado un pago pendiente (transferencia, QR o link)' })
  verifySalePayment(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.salesService.verifySale(id, tenantId);
  }

  @Patch(':id/revert-payment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Revierte un pago verificado a PENDING (administrativo)' })
  revertSalePayment(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.salesService.revertSalePayment(id, tenantId);
  }

  @Post(':id/voucher')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Subir imagen del comprobante de transferencia' })
  async uploadVoucher(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = `/uploads/${file.filename}`;
    return this.salesService.uploadVoucher(id, imageUrl, tenantId);
  }

  // ==========================================
  // CLIENTES (Customers / Fiados)
  // ==========================================

  @Get('customers/current-accounts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar cuentas corrientes de clientes' })
  findCustomerAccounts(
    @Query() query: CurrentAccountsQueryDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.salesService.findCustomerAccounts(query, tenantId);
  }

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
    @Body() dto: CreateCustomerPaymentDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.salesService.payDebt(id, dto, tenantId);
  }

  @Get('customers/:id/current-account')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Consultar movimientos de la cuenta corriente de un cliente' })
  getCustomerAccount(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.salesService.getCustomerAccount(id, tenantId);
  }

  // ==========================================
  // CUENTAS DE PAGO (Payment Accounts)
  // ==========================================

  @Get('payment-accounts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar cuentas de cobro (CBU/Alias)' })
  findAllPaymentAccounts(@GetTenantId() tenantId: string) {
    return this.salesService.findAllPaymentAccounts(tenantId);
  }

  @Post('payment-accounts')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nueva cuenta de cobro' })
  createPaymentAccount(
    @Body() dto: CreatePaymentAccountDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.salesService.createPaymentAccount(dto, tenantId);
  }

  @Patch('payment-accounts/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar cuenta de cobro' })
  updatePaymentAccount(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentAccountDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.salesService.updatePaymentAccount(id, dto, tenantId);
  }

  @Delete('payment-accounts/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar cuenta de cobro' })
  deletePaymentAccount(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.salesService.deletePaymentAccount(id, tenantId);
  }
}
