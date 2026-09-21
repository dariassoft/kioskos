import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';

import {
  CreateExpenseCategoryDto, UpdateExpenseCategoryDto,
  CreateExpenseDto, UpdateExpenseDto,
  VoidExpenseDto,
} from './dto/expenses.dto';

@ApiTags('expenses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ==========================================
  // CATEGORÍAS DE GASTOS
  // ==========================================

  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar categorías de gastos' })
  findAllCategories(@GetTenantId() tenantId: string) {
    return this.expensesService.findAllCategories(tenantId);
  }

  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear una categoría de gasto' })
  createCategory(
    @Body() dto: CreateExpenseCategoryDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.expensesService.createCategory(dto, tenantId);
  }

  @Patch('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar una categoría de gasto' })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseCategoryDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.expensesService.updateCategory(id, dto, tenantId);
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar una categoría de gasto' })
  removeCategory(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.expensesService.removeCategory(id, tenantId);
  }

  @Post('categories/seed')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear categorías por defecto (si no existen)' })
  seedCategories(@GetTenantId() tenantId: string) {
    return this.expensesService.seedDefaultCategories(tenantId);
  }

  // ==========================================
  // GASTOS
  // ==========================================

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar gastos (con filtro por fecha y categoría)' })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  @ApiQuery({ name: 'category_id', required: false })
  findAll(
    @GetTenantId() tenantId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('category_id') categoryId?: string,
  ) {
    return this.expensesService.findAll(tenantId, startDate, endDate, categoryId);
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Resumen de gastos por categoría' })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  getSummary(
    @GetTenantId() tenantId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.expensesService.getSummary(tenantId, startDate, endDate);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obtener un gasto por ID' })
  findOne(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.expensesService.findOne(id, tenantId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Registrar un nuevo gasto' })
  create(
    @Body() dto: CreateExpenseDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.expensesService.create(dto, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Editar un gasto' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.expensesService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un gasto' })
  remove(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.expensesService.remove(id, tenantId);
  }

  @Post(':id/void')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Anular un gasto y revertir su asiento contable' })
  voidExpense(
    @Param('id') id: string,
    @Body() dto: VoidExpenseDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.expensesService.voidExpense(id, dto.reason, tenantId);
  }
}
