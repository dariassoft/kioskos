import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentAccountType } from '../entities/payment-account.entity';

export class CreatePaymentAccountDto {
  @ApiProperty({ example: 'Banco Galicia' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: PaymentAccountType, example: PaymentAccountType.ALIAS })
  @IsEnum(PaymentAccountType)
  type: PaymentAccountType;

  @ApiProperty({ example: 'kiosko.demo.transfer' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdatePaymentAccountDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: PaymentAccountType })
  @IsEnum(PaymentAccountType)
  @IsOptional()
  type?: PaymentAccountType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  value?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
