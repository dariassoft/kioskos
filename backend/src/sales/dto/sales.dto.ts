import {
  IsString, IsNotEmpty, IsOptional, IsUUID,
  IsNumber, Min, IsEnum, ValidateNested, ArrayMinSize, IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '../entities/sale.entity';

const LEGACY_UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

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
  @ApiProperty({ description: 'ID de la sucursal' })
  @IsString()
  @IsNotEmpty()
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
  @IsUUID('all')
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

export class PaymentDetailsDto {
  @ApiPropertyOptional({ description: 'ID de pago de MercadoPago' })
  @IsOptional()
  @IsString()
  mp_payment_id?: string;

  @ApiPropertyOptional({ description: 'Estado del pago de MercadoPago' })
  @IsOptional()
  @IsString()
  mp_payment_status?: string;

  @ApiPropertyOptional({ description: 'Nombre del pagador' })
  @IsOptional()
  @IsString()
  payer_name?: string;

  @ApiPropertyOptional({ description: 'Email del pagador' })
  @IsOptional()
  @IsString()
  payer_email?: string;

  @ApiPropertyOptional({ description: 'Comprobante de transferencia' })
  @IsOptional()
  @IsString()
  transfer_voucher?: string;

  @ApiPropertyOptional({ description: 'Banco / billetera de origen' })
  @IsOptional()
  @IsString()
  transfer_origin?: string;

  @ApiPropertyOptional({ description: 'Últimos 4 dígitos de tarjeta' })
  @IsOptional()
  @IsString()
  card_last_digits?: string;

  @ApiPropertyOptional({ description: 'Marca de tarjeta' })
  @IsOptional()
  @IsString()
  card_brand?: string;

  @ApiPropertyOptional({ description: 'Código de autorización' })
  @IsOptional()
  @IsString()
  authorization_code?: string;

  @ApiPropertyOptional({ description: 'Notas adicionales del pago' })
  @IsOptional()
  @IsString()
  payment_notes?: string;
}

export class CreateSaleDto {
  @ApiProperty({ description: 'ID de la sucursal' })
  @IsString()
  @IsNotEmpty()
  branch_id: string;

  @ApiPropertyOptional()
  @IsUUID('all')
  @IsOptional()
  customer_id?: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Estado de cobro del pago' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  @ArrayMinSize(1)
  items: CreateSaleItemDto[];

  @ApiPropertyOptional({ type: PaymentDetailsDto, description: 'Detalles del pago (opcional)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  payment_details?: PaymentDetailsDto;

  // ─── Facturación Electrónica (AFIP) ───────────────────────────────────────
  @ApiPropertyOptional({ description: 'Solicitar factura electrónica ARCA' })
  @IsOptional()
  @IsNotEmpty()
  request_invoice?: boolean;

  @ApiPropertyOptional({ description: 'Tipo de documento para la factura (DNI=96, CUIT=80)' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  invoice_doc_tipo?: number;

  @ApiPropertyOptional({ description: 'Número de documento para la factura' })
  @IsOptional()
  @IsString()
  invoice_doc_nro?: string;
}

// ==========================================
// FILTROS / LISTADOS
// ==========================================

export class ListSalesQueryDto {
  @ApiPropertyOptional({ description: 'ID de la sucursal' })
  @IsOptional()
  @IsString()
  branch_id?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @ApiPropertyOptional({ example: '2026-04-01', description: 'Fecha desde (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-04-30', description: 'Fecha hasta (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  end_date?: string;
}
