import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { RequiresFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';

@ApiTags('accounting')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@Controller('accounting')
@RequiresFeature('automated_accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('ledger')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obtener el libro mayor por rango de fechas' })
  @ApiQuery({ name: 'startDate', type: String, required: true, example: '2026-04-01' })
  @ApiQuery({ name: 'endDate', type: String, required: true, example: '2026-04-30' })
  getLedger(
    @GetTenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.accountingService.getLedgerByDates(tenantId, startDate, endDate);
  }
}
