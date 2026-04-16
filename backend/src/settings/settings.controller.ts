import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
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
@ApiTags('settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly mercadopagoService: SettingsMercadopagoService,
  ) {}
  // SUCURSALES
  @Get('branches')
  @ApiOperation({ summary: 'Listar sucursales del negocio' })
  getBranches(@GetTenantId() tenantId: string) {
    return this.settingsService.getBranches(tenantId);
  }
  @Post('branches')
  @ApiOperation({ summary: 'Crear nueva sucursal' })
  createBranch(@Body() dto: CreateBranchSettingsDto, @GetTenantId() tenantId: string) {
    return this.settingsService.createBranch(dto, tenantId);
  }
  @Patch('branches/:id')
  @ApiOperation({ summary: 'Actualizar sucursal' })
  updateBranch(
    @Param('id') id: string,
    @Body() dto: UpdateBranchSettingsDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.settingsService.updateBranch(id, dto, tenantId);
  }
  @Delete('branches/:id')
  @ApiOperation({ summary: 'Eliminar sucursal (no la principal)' })
  deleteBranch(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.settingsService.deleteBranch(id, tenantId);
  }
  // USUARIOS
  @Get('users')
  @ApiOperation({ summary: 'Listar usuarios del negocio' })
  getUsers(@GetTenantId() tenantId: string) {
    return this.settingsService.getUsers(tenantId);
  }
  @Post('users')
  @ApiOperation({ summary: 'Crear nuevo usuario en el negocio' })
  createUser(@Body() dto: CreateUserSettingsDto, @GetTenantId() tenantId: string) {
    return this.settingsService.createUser(dto, tenantId);
  }
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
  @Get('business')
  @ApiOperation({ summary: 'Obtener perfil del negocio + plan actual' })
  getBusinessProfile(@GetTenantId() tenantId: string) {
    return this.settingsService.getBusinessProfile(tenantId);
  }
  @Patch('business')
  @ApiOperation({ summary: 'Actualizar datos del negocio' })
  updateBusinessProfile(
    @Body() dto: UpdateBusinessProfileDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.settingsService.updateBusinessProfile(dto, tenantId);
  }

  // MERCADOPAGO
  @Get('mercadopago')
  @ApiOperation({ summary: 'Obtener configuración de MercadoPago del negocio' })
  getMercadopago(@GetTenantId() tenantId: string) {
    return this.mercadopagoService.get(tenantId);
  }

  @Post('mercadopago')
  @ApiOperation({ summary: 'Guardar configuración de MercadoPago del negocio' })
  saveMercadopago(
    @Body() dto: SaveMercadopagoCredentialsDto,
    @GetTenantId() tenantId: string,
  ) {
    return this.mercadopagoService.save(dto, tenantId);
  }
}
