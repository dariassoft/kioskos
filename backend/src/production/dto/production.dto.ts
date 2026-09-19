import {
  IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum,
  IsArray, ValidateNested, ArrayMinSize, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RecipeType } from '../entities/recipe.entity';

// ==========================================
// RECETAS
// ==========================================

export class RecipeItemDto {
  @ApiProperty({ description: 'ID del insumo (producto, típicamente raw_material)' })
  @IsString()
  product_id: string;

  @ApiProperty({ example: 1, description: 'Cantidad APROXIMADA del insumo por tanda' })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity: number;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'Fraccionamiento alimento 20kg → 1kg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ enum: RecipeType, example: RecipeType.FRACTIONING })
  @IsEnum(RecipeType)
  type: RecipeType;

  @ApiProperty({ description: 'Producto que se obtiene (fractionated o elaborated)' })
  @IsString()
  output_product_id: string;

  @ApiProperty({ example: 20, description: 'Cantidad obtenida por tanda' })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  output_quantity: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [RecipeItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[];
}

export class UpdateRecipeDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ enum: RecipeType })
  @IsEnum(RecipeType)
  @IsOptional()
  type?: RecipeType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  output_product_id?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0.001)
  @IsOptional()
  @Type(() => Number)
  output_quantity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [RecipeItemDto], description: 'Si se envía, reemplaza todos los ítems' })
  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => RecipeItemDto)
  items?: RecipeItemDto[];
}

// ==========================================
// ÓRDENES DE PRODUCCIÓN
// ==========================================

export class ProductionInputDto {
  @ApiProperty({ description: 'ID del insumo consumido' })
  @IsString()
  product_id: string;

  @ApiProperty({ example: 20, description: 'Cantidad real consumida' })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity: number;
}

export class ProductionOutputDto {
  @ApiProperty({ description: 'ID del producto obtenido' })
  @IsString()
  product_id: string;

  @ApiProperty({ example: 20, description: 'Cantidad real obtenida' })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ description: 'Costo unitario manual. Si no se envía, se prorratea el costo de insumos' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  unit_cost?: number;
}

export class CreateProductionOrderDto {
  @ApiProperty({ description: 'Sucursal donde se produce y queda el stock' })
  @IsString()
  branch_id: string;

  @ApiPropertyOptional({ description: 'Receta usada como base (opcional — soporta producción manual multi-output)' })
  @IsString()
  @IsOptional()
  recipe_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [ProductionInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductionInputDto)
  inputs: ProductionInputDto[];

  @ApiProperty({ type: [ProductionOutputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductionOutputDto)
  outputs: ProductionOutputDto[];
}
