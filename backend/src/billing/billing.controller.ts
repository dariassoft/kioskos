import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/superadmin.guard';

@ApiTags('billing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ==========================================
  // MÉTRICAS
  // ==========================================
  @Get('metrics/mrr')
  @ApiOperation({ summary: '[SuperAdmin] MRR, suscripciones activas y gráfico de ingresos' })
  getMrr() {
    return this.billingService.getMrr();
  }

  @Get('metrics/expiring')
  @ApiOperation({ summary: '[SuperAdmin] Suscripciones próximas a vencer' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getExpiring(@Query('days') days?: number) {
    return this.billingService.getExpiringSubscriptions(days ? Number(days) : 7);
  }

  // ==========================================
  // PLANES
  // ==========================================
  @Get('plans')
  @ApiOperation({ summary: '[SuperAdmin] Listar todos los planes' })
  getPlans() {
    return this.billingService.getAllPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: '[SuperAdmin] Crear nuevo plan' })
  createPlan(@Body() body: any) {
    return this.billingService.createPlan(body);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: '[SuperAdmin] Actualizar un plan' })
  updatePlan(@Param('id') id: string, @Body() body: any) {
    return this.billingService.updatePlan(id, body);
  }

  @Patch('plans/:id/toggle')
  @ApiOperation({ summary: '[SuperAdmin] Activar/desactivar un plan' })
  togglePlan(@Param('id') id: string) {
    return this.billingService.togglePlanStatus(id);
  }

  // ==========================================
  // SUSCRIPCIONES
  // ==========================================
  @Get('subscriptions')
  @ApiOperation({ summary: '[SuperAdmin] Listar todas las suscripciones con detalles' })
  getAllSubscriptions() {
    return this.billingService.getAllSubscriptionsWithDetails();
  }

  @Get('subscriptions/:tenantId')
  @ApiOperation({ summary: '[SuperAdmin] Ver suscripción activa de un tenant' })
  getSubscription(@Param('tenantId') tenantId: string) {
    return this.billingService.getActiveSubscription(tenantId);
  }

  @Post('subscriptions/change-plan')
  @ApiOperation({ summary: '[SuperAdmin] Cambiar el plan de un tenant' })
  changePlan(@Body() body: { tenant_id: string; new_plan_id: string }) {
    return this.billingService.changePlan(body);
  }

  // ==========================================
  // HISTORIAL DE PAGOS
  // ==========================================
  @Get('history')
  @ApiOperation({ summary: '[SuperAdmin] Historial completo de pagos (todos los tenants)' })
  @ApiQuery({ name: 'tenant_id', required: false })
  getAllHistory(@Query('tenant_id') tenantId?: string) {
    return this.billingService.getAllBillingHistory(tenantId);
  }

  @Get('history/:tenantId')
  @ApiOperation({ summary: '[SuperAdmin] Historial de pagos de un tenant específico' })
  getBillingHistory(@Param('tenantId') tenantId: string) {
    return this.billingService.getBillingHistory(tenantId);
  }

  @Post('payments')
  @ApiOperation({ summary: '[SuperAdmin] Registrar pago manual (extiende suscripción)' })
  registerPayment(@Body() body: {
    tenant_id: string;
    amount: number;
    payment_method: string;
    notes?: string;
    months?: number;
  }) {
    return this.billingService.registerPayment(body);
  }
}
