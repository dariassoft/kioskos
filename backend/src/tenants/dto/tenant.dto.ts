import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TenantStatus } from '../entities/tenant.entity';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  business_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  tax_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  logo_url?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  owner_name: string;

  @IsEmail()
  owner_email: string;

  @IsString()
  @MinLength(8)
  owner_password: string;

  /** Plan activo que se asignará durante la provisión inicial. */
  @IsString()
  @IsNotEmpty()
  plan_id: string;
}

export class UpdateTenantStatusDto {
  @IsEnum(TenantStatus)
  status: TenantStatus;
}