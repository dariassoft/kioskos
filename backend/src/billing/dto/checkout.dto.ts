import {
  IsString, IsEmail, IsNotEmpty, IsUUID,
  IsOptional, MinLength, MaxLength, IsIn, IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({ example: 'plan-negocio-001' })
  @IsString()
  @IsNotEmpty()
  plan_id: string;

  @ApiProperty({ example: 'Kiosko Don Pedro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  business_name: string;

  @ApiProperty({ example: 'Pedro González' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  owner_name: string;

  @ApiProperty({ example: 'pedro@mail.com' })
  @IsEmail()
  owner_email: string;

  @ApiPropertyOptional({ example: '+54 11 9999-8888' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  owner_phone?: string;

  @ApiPropertyOptional({ example: '20-12345678-9' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  tax_id?: string;

  @ApiProperty({ example: 'MiClave123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'mercadopago', enum: ['mercadopago', 'transfer', 'trial'] })
  @IsIn(['mercadopago', 'transfer', 'trial'])
  payment_method: 'mercadopago' | 'transfer' | 'trial';

  @ApiPropertyOptional({ description: 'Autorizar el débito mensual automático en MercadoPago' })
  @IsBoolean()
  @IsOptional()
  auto_renew?: boolean;

  @ApiPropertyOptional({ example: 'ABC12345' })
  @IsString()
  @IsOptional()
  referred_by_code?: string;
}

export class ConfirmTransferDto {
  @ApiProperty({ description: 'ID del pending_subscription' })
  @IsUUID('all')
  pending_id: string;

  @ApiProperty({ example: 'pedro.gonzalez.bru' })
  @IsString()
  @IsNotEmpty()
  transfer_alias: string;

  @ApiPropertyOptional({ example: 'Ref: 00012345' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  transfer_notes?: string;

  @ApiPropertyOptional({ description: 'Comprobante codificado como data URL' })
  @IsString()
  @IsOptional()
  @MaxLength(7_000_000)
  transfer_voucher?: string;
}

