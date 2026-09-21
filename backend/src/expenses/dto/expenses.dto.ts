import {
  IsString, IsNotEmpty, IsOptional, IsUUID,
  IsNumber, Min, IsEnum, IsDateString, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ExpensePaymentMethod } from '../entities/expense.entity';

// ==========================================
// CATEGORÍAS DE GASTOS
// ==========================================

export class CreateExpenseCategoryDto {
  @ApiProperty({ example: 'Alquiler' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '#ef4444' })
  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;
}

export class UpdateExpenseCategoryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;
}

// ==========================================
// GASTOS
// ==========================================

export class CreateExpenseDto {
  @ApiProperty({ example: 'Alquiler del local - Junio 2026' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: '2026-04-21' })
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsUUID('all')
  category_id: string;

  @ApiPropertyOptional()
  @IsUUID('all')
  @IsOptional()
  branch_id?: string;

  @ApiProperty({ enum: ExpensePaymentMethod, example: ExpensePaymentMethod.CASH })
  @IsEnum(ExpensePaymentMethod)
  payment_method: ExpensePaymentMethod;

  @ApiPropertyOptional({ example: 'FC-001234' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  receipt_number?: string;

  @ApiPropertyOptional({ example: 'Transferido desde Cuenta Nación xxx-1234' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Foto del comprobante en base64' })
  @IsString()
  @IsOptional()
  receipt_image?: string;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional()
  @IsUUID('all')
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional()
  @IsUUID('all')
  @IsOptional()
  branch_id?: string;

  @ApiPropertyOptional({ enum: ExpensePaymentMethod })
  @IsEnum(ExpensePaymentMethod)
  @IsOptional()
  payment_method?: ExpensePaymentMethod;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  receipt_number?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  receipt_image?: string;
}

export class VoidExpenseDto {
  @ApiProperty({ example: 'Comprobante cargado por error' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
