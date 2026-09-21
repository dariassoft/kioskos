import {
  IsString, IsNotEmpty, IsOptional, IsUUID,
  IsNumber, Min, IsEnum, ValidateNested, ArrayMinSize, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ==========================================
// PROVEEDORES
// ==========================================

export class CreateSupplierDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contact_name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tax_id?: string;

  @ApiPropertyOptional({ description: 'Habilita una cuenta corriente con este proveedor' })
  @IsOptional()
  @Type(() => Boolean)
  current_account_enabled?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Saldo inicial de la cuenta corriente' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  opening_balance?: number;
}

export class UpdateSupplierDto extends CreateSupplierDto {}

export class SupplierCurrentAccountsQueryDto {
  @ApiPropertyOptional({ example: 'Distribuidora', description: 'Buscar por nombre, teléfono o email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

// ==========================================
// ÓRDENES DE COMPRA
// ==========================================

export class CreatePurchaseOrderItemDto {
  @ApiProperty()
  @IsUUID('all')
  product_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unit_cost: number;

  @ApiPropertyOptional({ example: 21, description: 'IVA de la línea. Si se omite se usa el IVA del producto.' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  vat_rate?: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsUUID('all')
  supplier_id: string;

  @ApiProperty()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: 'branch_id debe tener formato UUID' })
  branch_id: string;

  @ApiProperty({ type: [CreatePurchaseOrderItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  @ArrayMinSize(1)
  items: CreatePurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto extends CreatePurchaseOrderDto {}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ type: [CreatePurchaseOrderItemDto], description: 'Mercadería realmente entregada por el proveedor' })
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  @ArrayMinSize(1)
  items: CreatePurchaseOrderItemDto[];
}

export enum PurchaseReturnSettlementDto {
  CREDIT_NOTE = 'credit_note',
  CASH_REFUND = 'cash_refund',
  BANK_REFUND = 'bank_refund',
}

export class CreatePurchaseReturnItemDto {
  @ApiProperty()
  @IsUUID('all')
  product_id: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity: number;
}

export class CreatePurchaseReturnDto {
  @ApiProperty({ type: [CreatePurchaseReturnItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseReturnItemDto)
  @ArrayMinSize(1)
  items: CreatePurchaseReturnItemDto[];

  @ApiProperty({ example: 'Mercadería dañada' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ enum: PurchaseReturnSettlementDto })
  @IsEnum(PurchaseReturnSettlementDto)
  settlement_method: PurchaseReturnSettlementDto;
}

export class CreatePurchasePaymentDto {
  @IsNumber() @Min(0.01) @Type(() => Number)
  amount: number;

  @IsEnum(['cash', 'transfer', 'bank'])
  payment_method: 'cash' | 'transfer' | 'bank';

  @IsOptional() @IsString()
  notes?: string;
}
