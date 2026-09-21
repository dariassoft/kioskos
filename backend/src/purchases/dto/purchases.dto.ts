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
}

export class UpdateSupplierDto extends CreateSupplierDto {}

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
