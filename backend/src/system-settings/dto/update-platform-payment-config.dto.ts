import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';

export class PlatformTransferAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(36)
  id?: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  alias?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  cbu?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  holder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bank?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePlatformPaymentConfigDto {
  @IsOptional()
  @IsBoolean()
  mercadopago_enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mercadopago_public_key?: string;

  /** Si se envía vacío se conserva el token ya guardado. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mercadopago_access_token?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformTransferAccountDto)
  transfer_accounts: PlatformTransferAccountDto[];
}