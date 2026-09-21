import {
  IsString, IsNotEmpty, IsOptional, IsBoolean,
  IsUUID, IsNumber, Min, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Leche Entera La Serenísima 1L' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Leche entera larga vida' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '7790040913498' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({ example: 'PRD-001' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  internal_code?: string;

  @ApiPropertyOptional({ description: 'ID de la unidad de medida' })
  @IsString()
  @IsOptional()
  unit_id?: string;

  @ApiPropertyOptional({ description: 'ID de la categoría' })
  @IsString()
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional({ example: 850.0, description: 'Precio de costo' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  cost_price?: number;

  @ApiPropertyOptional({ example: 21, description: 'Alícuota de IVA del producto' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  vat_rate?: number;

  @ApiPropertyOptional({ example: 5.0, description: 'Umbral de stock mínimo para alertas' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  min_stock_alert?: number;

  @ApiPropertyOptional({ description: 'URL de la imagen del producto' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({ description: 'ID de la marca' })
  @IsString()
  @IsOptional()
  brand_id?: string;

  @ApiPropertyOptional({ description: 'ID del proveedor' })
  @IsString()
  @IsOptional()
  supplier_id?: string;

  @ApiPropertyOptional({ example: 1200.0, description: 'Precio de venta inicial' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sale_price?: number;

  @ApiPropertyOptional({ example: 30, description: 'Margen de ganancia esperado (%)' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sale_margin?: number;

  @ApiPropertyOptional({
    enum: ['standard', 'raw_material', 'fractionated', 'elaborated'],
    description: 'Tipo de producto: standard (default), raw_material (insumo, no se vende en POS), fractionated, elaborated',
  })
  @IsString()
  @IsOptional()
  product_type?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internal_code?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unit_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  cost_price?: number;

  @ApiPropertyOptional({ example: 21, description: 'Alícuota de IVA del producto' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  vat_rate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  min_stock_alert?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brand_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supplier_id?: string;

  @ApiPropertyOptional({ enum: ['standard', 'raw_material', 'fractionated', 'elaborated'] })
  @IsString()
  @IsOptional()
  product_type?: string;

  @ApiPropertyOptional({ example: 1200, description: 'Precio de venta en la lista por defecto' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sale_price?: number;

  @ApiPropertyOptional({ example: 35, description: 'Margen de ganancia (%) para calcular el precio de venta' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sale_margin?: number;
}

export class SetPriceDto {
  @ApiProperty({ description: 'ID de la lista de precios' })
  @IsString()
  price_list_id: string;

  @ApiProperty({ example: 1200.0 })
  @IsNumber()
  @Type(() => Number)
  price: number;
}

export class CreateBrandDto {
  @ApiProperty({ example: 'Coca-Cola' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateStockDto {
  @ApiProperty({ description: 'ID de la sucursal' })
  @IsString()
  branch_id: string;

  @ApiProperty({ example: 50.0, description: 'Cantidad a agregar al stock actual' })
  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ example: 5.0, description: 'Stock mínimo para alerta' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  min_stock_alert?: number;
}

export class CreateBranchDto {
  @ApiProperty({ example: 'Sucursal Centro' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Av. Corrientes 1234' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '011-4444-5555' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_main_branch?: boolean;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Lácteos' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '#3b82f6' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'milk' })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class CreateUnitDto {
  @ApiProperty({ example: 'Kilogramo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Kg' })
  @IsString()
  @IsOptional()
  abbreviation?: string;
}

export class ProductQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional({ enum: ['standard', 'raw_material', 'fractionated', 'elaborated'], description: 'Filtrar por tipo de producto' })
  @IsString()
  @IsOptional()
  product_type?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 25 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 25;
}

export enum PriceAdjustmentType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export class BulkUpdatePriceDto {
  @ApiPropertyOptional({ description: 'Filtrar por categoría' })
  @IsString()
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional({ description: 'Filtrar por proveedor' })
  @IsString()
  @IsOptional()
  supplier_id?: string;

  @ApiPropertyOptional({ description: 'Filtrar por marca' })
  @IsString()
  @IsOptional()
  brand_id?: string;

  @ApiProperty({ enum: PriceAdjustmentType, example: 'percentage' })
  @IsString()
  adjustment_type: PriceAdjustmentType;

  @ApiProperty({ example: 10, description: 'Valor del ajuste (puede ser negativo)' })
  @IsNumber()
  @Type(() => Number)
  value: number;

  @ApiPropertyOptional({ description: 'ID de la lista de precios a afectar (por defecto la principal)' })
  @IsOptional()
  @IsString()
  price_list_id?: string;
}

export class TransferStockDto {
  @ApiProperty({ description: 'ID del producto a transferir' })
  @IsUUID()
  product_id: string;

  @ApiProperty({ description: 'ID de sucursal de origen' })
  @IsUUID()
  from_branch_id: string;

  @ApiProperty({ description: 'ID de sucursal de destino' })
  @IsUUID()
  to_branch_id: string;

  @ApiProperty({ example: 10, description: 'Cantidad a transferir' })
  @IsNumber()
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  @Type(() => Number)
  quantity: number;
}
