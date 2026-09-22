import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price_monthly: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  max_branches: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  max_users: number;

  @IsObject()
  features: Record<string, boolean>;
}

export class UpdatePlanDto extends CreatePlanDto {}

export class ChangePlanAdminDto {
  @IsUUID('all')
  tenant_id: string;

  @IsString()
  @IsNotEmpty()
  new_plan_id: string;
}

export class RegisterPaymentAdminDto {
  @IsUUID('all')
  tenant_id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsIn(['cash', 'transfer', 'bank', 'mercadopago'])
  payment_method: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  months?: number;
}