import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { PromotionService } from './promotion.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/superadmin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import {
  ChangePlanAdminDto,
  CreatePlanDto,
  RegisterPaymentAdminDto,
  UpdatePlanDto,
} from './dto/billing.dto';

@ApiTags('billing')
@ApiBearerAuth('JWT-auth')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly promotionService: PromotionService,
  ) {}

  // ==========================================
  // MÉTRICAS (SuperAdmin)
  // ==========================================
  @Get('metrics/mrr')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] MRR, suscripciones activas y gráfico de ingresos' })
  getMrr() {
    return this.billingService.getMrr();
  }

  @Get('metrics/expiring')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Suscripciones próximas a vencer' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getExpiring(@Query('days') days?: number) {
    return this.billingService.getExpiringSubscriptions(days ? Number(days) : 7);
  }

  // ==========================================
  // COBROS PRÓXIMOS (SuperAdmin)
  // ==========================================
  @Get('upcoming-charges')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Cobros próximos con detalle de montos' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getUpcomingCharges(@Query('days') days?: number) {
    return this.billingService.getUpcomingCharges(days ? Number(days) : 30);
  }

  // ==========================================
  // PLANES (SuperAdmin)
  // ==========================================
  @Get('plans')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Listar todos los planes' })
  getPlans() {
    return this.billingService.getAllPlans();
  }

  @Post('plans')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Crear nuevo plan' })
  createPlan(@Body() dto: CreatePlanDto) {
    return this.billingService.createPlan(dto);
  }

  @Patch('plans/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Actualizar un plan' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.billingService.updatePlan(id, dto);
  }

  @Patch('plans/:id/toggle')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Activar/desactivar un plan' })
  togglePlan(@Param('id') id: string) {
    return this.billingService.togglePlanStatus(id);
  }

  // ==========================================
  // SUSCRIPCIONES (SuperAdmin)
  // ==========================================
  @Get('subscriptions')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Listar todas las suscripciones con detalles' })
  getAllSubscriptions() {
    return this.billingService.getAllSubscriptionsWithDetails();
  }

  @Get('subscriptions/:tenantId')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Ver suscripción activa de un tenant' })
  getSubscription(@Param('tenantId') tenantId: string) {
    return this.billingService.getActiveSubscription(tenantId);
  }

  @Post('subscriptions/change-plan')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Cambiar el plan de un tenant' })
  changePlan(@Body() dto: ChangePlanAdminDto) {
    return this.billingService.changePlan(dto);
  }

  // ==========================================
  // MI SUSCRIPCIÓN (Usuario dueño del kiosko)
  // ==========================================
  @Get('my-subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ver mi suscripción activa' })
  getMySubscription(@GetTenantId() tenantId: string) {
    return this.billingService.getActiveSubscription(tenantId);
  }

  @Post('my-subscription/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancelar mi suscripción (darse de baja)' })
  cancelMySubscription(
    @GetTenantId() tenantId: string,
    @Body() body: { reason?: string },
  ) {
    return this.billingService.cancelSubscription(tenantId, body.reason);
  }

  @Get('my-billing-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ver mi historial de pagos' })
  getMyBillingHistory(@GetTenantId() tenantId: string) {
    return this.billingService.getBillingHistory(tenantId);
  }

  // ==========================================
  // HISTORIAL DE PAGOS (SuperAdmin)
  // ==========================================
  @Get('history')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Historial completo de pagos (todos los tenants)' })
  @ApiQuery({ name: 'tenant_id', required: false })
  getAllHistory(@Query('tenant_id') tenantId?: string) {
    return this.billingService.getAllBillingHistory(tenantId);
  }

  @Get('history/:tenantId')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Historial de pagos de un tenant específico' })
  getBillingHistory(@Param('tenantId') tenantId: string) {
    return this.billingService.getBillingHistory(tenantId);
  }

  @Post('payments')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Registrar pago manual (extiende suscripción)' })
  registerPayment(@Body() dto: RegisterPaymentAdminDto) {
    return this.billingService.registerPayment(dto);
  }

  // ==========================================
  // PROMOCIONES (SuperAdmin)
  // ==========================================
  @Get('promotions')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Listar todas las promociones' })
  getAllPromotions() {
    return this.promotionService.findAll();
  }

  @Post('promotions')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Crear una promoción' })
  createPromotion(@Body() body: any) {
    return this.promotionService.create(body);
  }

  @Patch('promotions/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Actualizar una promoción' })
  updatePromotion(@Param('id') id: string, @Body() body: any) {
    return this.promotionService.update(id, body);
  }

  @Delete('promotions/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Eliminar una promoción' })
  removePromotion(@Param('id') id: string) {
    return this.promotionService.remove(id);
  }
}
