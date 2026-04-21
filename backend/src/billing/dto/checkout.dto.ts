import {
  IsString, IsEmail, IsNotEmpty, IsUUID,
  IsOptional, MinLength, MaxLength, IsIn,
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

  @ApiProperty({ example: 'mercadopago', enum: ['mercadopago', 'transfer'] })
  @IsIn(['mercadopago', 'transfer'])
  payment_method: 'mercadopago' | 'transfer';
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
  transfer_notes?: string;
}

