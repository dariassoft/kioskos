import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/superadmin.guard';

@ApiTags('billing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: '[SuperAdmin] Listar planes activos' })
  getPlans() {
    return this.billingService.getActivePlans();
  }

  @Post('plans')
  @ApiOperation({ summary: '[SuperAdmin] Crear nuevo plan' })
  createPlan(@Body() body: any) {
    return this.billingService.createPlan(body);
  }

  @Get('subscriptions/:tenantId')
  @ApiOperation({ summary: '[SuperAdmin] Ver suscripción activa de un tenant' })
  getSubscription(@Param('tenantId') tenantId: string) {
    return this.billingService.getActiveSubscription(tenantId);
  }

  @Get('history/:tenantId')
  @ApiOperation({ summary: '[SuperAdmin] Historial de cobros de un tenant' })
  getBillingHistory(@Param('tenantId') tenantId: string) {
    return this.billingService.getBillingHistory(tenantId);
  }
}
