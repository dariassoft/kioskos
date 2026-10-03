import { Controller, Get, Patch, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/superadmin.guard';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { UpdatePlatformPaymentConfigDto } from './dto/update-platform-payment-config.dto';

@ApiTags('system-settings')
@ApiBearerAuth('JWT-auth')
@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get('public-info')
  @ApiOperation({ summary: 'Obtener información pública del sistema (trial, referidos)' })
  getPublicInfo() {
    return this.settingsService.getPublicSettings();
  }

  @Get()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Obtener todas las configuraciones globales' })
  getAll() {
    return this.settingsService.getAllSettings();
  }

  @Get('platform-payments')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Ver configuración de cobros de suscripciones' })
  getPlatformPayments() {
    return this.settingsService.getPlatformPaymentConfig();
  }

  @Patch('platform-payments')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Configurar Mercado Pago y cuentas de transferencia' })
  updatePlatformPayments(@Body() dto: UpdatePlatformPaymentConfigDto) {
    return this.settingsService.updatePlatformPaymentConfig(dto);
  }

  @Patch(':key')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Actualizar una configuración global' })
  update(@Param('key') key: string, @Body() body: UpdateSystemSettingDto) {
    return this.settingsService.updateSetting(key, body.value);
  }
}
