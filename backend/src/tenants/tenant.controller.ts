import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/superadmin.guard';
import { TenantStatus } from './entities/tenant.entity';

@ApiTags('tenants')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @ApiOperation({ summary: '[SuperAdmin] Listar todos los negocios' })
  findAll() {
    return this.tenantService.findAll();
  }

  @Get('metrics')
  @ApiOperation({ summary: '[SuperAdmin] Métricas de tenants (activos, trials, etc.)' })
  getMetrics() {
    return this.tenantService.getMetrics();
  }

  @Get(':id')
  @ApiOperation({ summary: '[SuperAdmin] Ver un negocio por ID' })
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '[SuperAdmin] Crear nuevo negocio' })
  create(@Body() body: any) {
    return this.tenantService.create(body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '[SuperAdmin] Activar/Suspender un negocio' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TenantStatus,
  ) {
    return this.tenantService.updateStatus(id, status);
  }
}
