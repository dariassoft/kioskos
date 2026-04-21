import { Controller, Get, Patch, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/superadmin.guard';

@ApiTags('system-settings')
@ApiBearerAuth('JWT-auth')
@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get('public-info')
  @UseGuards(JwtAuthGuard)
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

  @Patch(':key')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '[SuperAdmin] Actualizar una configuración global' })
  update(@Param('key') key: string, @Body() body: { value: string }) {
    return this.settingsService.updateSetting(key, body.value);
  }
}
