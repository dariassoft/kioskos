import {
  IsEnum, IsString, IsNumber, IsBoolean, IsOptional,
  IsInt, Min, Max, Length, IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AfipAuthMode, TipoIva } from '../entities/afip-credentials.entity';

// ==========================================
// CONFIGURAR CREDENCIALES ARCA
// ==========================================

export class SaveAfipCredentialsDto {
  @ApiProperty({ enum: AfipAuthMode, description: 'Modo de autenticación con ARCA' })
  @IsEnum(AfipAuthMode)
  auth_mode: AfipAuthMode;

  @ApiProperty({ example: '20123456789', description: 'CUIT del emisor (11 dígitos sin guiones)' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'El CUIT debe tener exactamente 11 dígitos' })
  cuit: string;

  @ApiPropertyOptional({ description: 'Certificado X.509 en formato PEM (requerido si auth_mode=certificate)' })
  @IsOptional()
  @IsString()
  certificate?: string;

  @ApiPropertyOptional({ description: 'Clave privada en formato PEM (requerida si auth_mode=certificate)' })
  @IsOptional()
  @IsString()
  private_key?: string;

  @ApiPropertyOptional({ description: 'Access Token de AfipSDK.com (requerido si auth_mode=access_token)' })
  @IsOptional()
  @IsString()
  access_token?: string;

  @ApiProperty({ example: 1, description: 'Número del punto de venta habilitado en ARCA (1-99999)' })
  @IsInt()
  @Min(1)
  @Max(99999)
  punto_de_venta: number;

  @ApiProperty({ example: 'Mi Kiosko S.A.S.', description: 'Razón social del emisor' })
  @IsString()
  @IsNotEmpty()
  razon_social: string;

  @ApiProperty({ enum: TipoIva, description: 'Tipo de contribuyente IVA' })
  @IsEnum(TipoIva)
  tipo_iva: TipoIva;

  @ApiProperty({
    example: false,
    description: 'false = Homologación ARCA (testing) | true = Producción real',
  })
  @IsBoolean()
  production_mode: boolean;
}

// ==========================================
// GENERAR FACTURA ELECTRÓNICA
// ==========================================

export class GenerateInvoiceDto {
  @ApiPropertyOptional({ description: 'ID de la venta a facturar (opcional)' })
  @IsOptional()
  @IsString()
  sale_id?: string;

  @ApiProperty({ example: 1, description: 'Concepto: 1=Productos, 2=Servicios, 3=Ambos' })
  @IsInt()
  @Min(1)
  @Max(3)
  concepto: number;

  @ApiProperty({ example: 99, description: 'Tipo doc receptor: 80=CUIT, 96=DNI, 99=Sin especificar' })
  @IsInt()
  doc_tipo_receptor: number;

  @ApiProperty({ example: 0, description: 'Nro. de documento del receptor (0 para consumidor final)' })
  @IsNumber()
  doc_nro_receptor: number;

  @ApiPropertyOptional({ example: 'Juan García', description: 'Nombre del receptor' })
  @IsOptional()
  @IsString()
  nombre_receptor?: string;

  @ApiProperty({ example: 5000.00, description: 'Importe total del comprobante' })
  @IsNumber()
  @Min(0.01)
  importe_total: number;

  @ApiPropertyOptional({ example: 4132.23, description: 'Importe neto gravado (Responsable Inscripto)' })
  @IsOptional()
  @IsNumber()
  importe_neto?: number;

  @ApiPropertyOptional({ example: 867.77, description: 'Importe de IVA (Responsable Inscripto)' })
  @IsOptional()
  @IsNumber()
  importe_iva?: number;

  @ApiPropertyOptional({ example: 5, description: 'Alícuota IVA: 3=0%, 4=10.5%, 5=21%, 6=27%' })
  @IsOptional()
  @IsInt()
  alicuota_iva?: number;
}

// ==========================================
// QUERY PARAMS PARA LISTADO
// ==========================================

export class ListInvoicesQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Página (base 1)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Resultados por página' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

