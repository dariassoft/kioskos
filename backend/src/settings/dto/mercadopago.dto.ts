import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveMercadopagoCredentialsDto {
  @ApiProperty({ description: 'Public Key de MercadoPago' })
  @IsString()
  @IsNotEmpty()
  public_key: string;

  @ApiProperty({ description: 'Access Token de MercadoPago' })
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @ApiPropertyOptional({ description: 'ID de tienda (opcional)' })
  @IsString()
  @IsOptional()
  store_id?: string;

  @ApiPropertyOptional({ description: 'ID de punto de venta (opcional)' })
  @IsString()
  @IsOptional()
  pos_id?: string;

  @ApiProperty({ description: 'Modo sandbox (true) o producción (false)' })
  @IsBoolean()
  @IsOptional()
  is_sandbox?: boolean;
}

