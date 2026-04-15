import {
  IsString, IsNotEmpty, IsOptional, IsUUID,
  IsNumber, Min, IsEnum, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/sale.entity';

// ==========================================
// CLIENTES (Customers)
// ==========================================

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 10000.0, description: 'Límite de fiado autorizado' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  credit_limit?: number;
}

export class UpdateCustomerDto extends CreateCustomerDto {}

// ==========================================
// CAJA REGISTRADORA (Cash Register)
// ==========================================

export class OpenCashRegisterDto {
  @ApiProperty()
  @IsUUID()
  branch_id: string;

  @ApiProperty({ example: 5000.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  opening_balance: number;
}

export class CloseCashRegisterDto {
  @ApiProperty({ example: 15000.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  closing_balance: number;
}

// ==========================================
// VENTAS (Sales)
// ==========================================

export class CreateSaleItemDto {
  @ApiProperty()
  @IsUUID()
  product_id: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unit_price: number;
}

export class CreateSaleDto {
  @ApiProperty()
  @IsUUID()
  branch_id: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  customer_id?: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  @ArrayMinSize(1)
  items: CreateSaleItemDto[];
}
