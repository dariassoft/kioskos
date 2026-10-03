import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { RequiresFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';

@ApiTags('reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@Controller('reports')
@RequiresFeature('reports_bi')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Métricas macro del Dashboard principal' })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  getDashboardMetrics(
    @GetTenantId() tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getDashboardMetrics(tenantId, branchId);
  }

  @Get('chart/weekly')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Gráfico de barras: Últimos 7 días' })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  getWeeklyChart(
    @GetTenantId() tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getWeeklySalesChart(tenantId, branchId);
  }

  @Get('chart/top-products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Ranking: Productos más vendidos (Pie Chart)' })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  getTopProducts(
    @GetTenantId() tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getTopSellingProducts(tenantId, branchId);
  }

  @Get('inventory-valuation')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'KPI: Capital inmovilizado en stock real' })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  getInventoryValuation(
    @GetTenantId() tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getInventoryValuation(tenantId, branchId);
  }
}
