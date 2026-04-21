import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { SettingsMercadopagoService } from './settings-mercadopago.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { GetTenantId } from '@common/decorators/get-tenant.decorator';
import {
  CreateBranchSettingsDto, UpdateBranchSettingsDto,
  CreateUserSettingsDto, UpdateUserSettingsDto, UpdateBusinessProfileDto,
} from './dto/settings.dto';
import { SaveMercadopagoCredentialsDto } from './dto/mercadopago.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly mercadopagoService: SettingsMercadopagoService,
    private readonly configService: ConfigService,
  ) {}
  // SUCURSALES
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('branches')
  @ApiOperation({ summary: 'Listar sucursales del negocio' })
  getBranches(@GetTenantId() tenantId: string) {
    return this.settingsService.getBranches(tenantId);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('branches')
  @ApiOperation({ summary: 'Crear nueva sucursal' })
  createBranch(@Body() dto: CreateBranchSettingsDto, @GetTenantId() tenantId: string) {
    return this.settingsService.createBranch(dto, tenantId);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('branches/:id')
  @ApiOperation({ summary: 'Actualizar sucursal' })
  updateBranch(
    @Param('id') id: string,
    @Body() dto: UpdateBranchSettingsDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.settingsService.updateBranch(id, dto, tenantId);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete('branches/:id')
  @ApiOperation({ summary: 'Eliminar sucursal (no la principal)' })
  deleteBranch(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.settingsService.deleteBranch(id, tenantId);
  }
  // USUARIOS
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('users')
  @ApiOperation({ summary: 'Listar usuarios del negocio' })
  getUsers(@GetTenantId() tenantId: string) {
    return this.settingsService.getUsers(tenantId);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('users')
  @ApiOperation({ summary: 'Crear nuevo usuario en el negocio' })
  createUser(@Body() dto: CreateUserSettingsDto, @GetTenantId() tenantId: string) {
    return this.settingsService.createUser(dto, tenantId);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('users/:id')
  @ApiOperation({ summary: 'Actualizar usuario (rol, sucursal, activo)' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserSettingsDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.settingsService.updateUser(id, dto, tenantId);
  }
  // PERFIL DEL NEGOCIO
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('business')
  @ApiOperation({ summary: 'Obtener perfil del negocio + plan actual' })
  getBusinessProfile(@GetTenantId() tenantId: string) {
    return this.settingsService.getBusinessProfile(tenantId);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('business')
  @ApiOperation({ summary: 'Actualizar datos del negocio' })
  updateBusinessProfile(
    @Body() dto: UpdateBusinessProfileDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.settingsService.updateBusinessProfile(dto, tenantId);
  }

  // MERCADOPAGO
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('mercadopago')
  @ApiOperation({ summary: 'Obtener configuración de MercadoPago del negocio' })
  getMercadopago(@GetTenantId() tenantId: string) {
    return this.mercadopagoService.get(tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('mercadopago')
  @ApiOperation({ summary: 'Guardar configuración de MercadoPago del negocio' })
  saveMercadopago(
    @Body() dto: SaveMercadopagoCredentialsDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.mercadopagoService.save(dto, tenantId);
  }

  // OAUTH MERCADOPAGO
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('mercadopago/auth-url')
  @ApiOperation({ summary: 'Obtener URL para vincular cuenta de MercadoPago (OAuth)' })
  async getMpAuthUrl(@GetTenantId() tenantId: string) {
    try {
      const url = await this.mercadopagoService.getAuthUrl(tenantId);
      return { url };
    } catch (error) {
      console.error('[MP-ERROR] Error al generar Auth URL:', error.message);
      throw error; 
    }
  }

  @Get('mercadopago/callback')
  @ApiOperation({ summary: 'Callback de MercadoPago para vinculación OAuth' })
  async mpCallback(
    @Query('code') code: string,
    @Query('state') tenantId: string,
    @Res() res: Response,
  ) {
    try {
      if (!code || !tenantId) {
        throw new Error('Código o TenantId faltante');
      }
      await this.mercadopagoService.handleCallback(code, tenantId);
      
      // Redirigir al frontend al terminar con éxito
      const frontendUrl = this.configService.get<string>('APP_URL_FRONTEND') || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/settings/mercadopago?success=true`);
    } catch (error) {
      console.error('Error en MP Callback:', error);
      const frontendUrl = this.configService.get<string>('APP_URL_FRONTEND') || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/settings/mercadopago?error=${encodeURIComponent(error.message)}`);
    }
  }
}
