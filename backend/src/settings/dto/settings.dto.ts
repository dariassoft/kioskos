import {
  IsString, IsNotEmpty, IsOptional, IsBoolean,
  IsEmail, IsEnum, MinLength, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==========================================
// SUCURSALES
// ==========================================
export class CreateBranchSettingsDto {
  @ApiProperty({ example: 'Sucursal Norte' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Av. Corrientes 1234' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '+54 11 1234-5678' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  is_main_branch?: boolean;
}

export class UpdateBranchSettingsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;
}

// ==========================================
// USUARIOS
// ==========================================
export enum SettingsUserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
}

export class CreateUserSettingsDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'juan@kiosko.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: SettingsUserRole, example: SettingsUserRole.CASHIER })
  @IsEnum(SettingsUserRole)
  role: SettingsUserRole;

  @ApiPropertyOptional({ description: 'ID de la sucursal asignada' })
  @IsString()
  @IsOptional()
  branch_id?: string;
}

export class UpdateUserSettingsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: SettingsUserRole })
  @IsEnum(SettingsUserRole)
  @IsOptional()
  role?: SettingsUserRole;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  branch_id?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Nueva contraseña (opcional)' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}

// ==========================================
// PERFIL DEL NEGOCIO
// ==========================================
export class UpdateBusinessProfileDto {
  @ApiPropertyOptional({ example: 'Kiosko Don Pedro' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  business_name?: string;

  @ApiPropertyOptional({ example: '20-12345678-9' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  tax_id?: string;

  @ApiPropertyOptional({ example: '+54 11 9876-5432' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'Av. Rivadavia 500, CABA' })
  @IsString()
  @IsOptional()
  address?: string;
}

