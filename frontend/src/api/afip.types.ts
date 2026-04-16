// ==========================================
// TIPOS DE FACTURACIÓN ELECTRÓNICA ARCA
// ==========================================

export enum AfipAuthMode {
  CERTIFICATE = 'certificate',
  ACCESS_TOKEN = 'access_token',
}

export enum TipoIva {
  MONOTRIBUTISTA = 'monotributista',
  RESPONSABLE_INSCRIPTO = 'responsable_inscripto',
}

export interface AfipCredentials {
  is_configured: boolean
  auth_mode: AfipAuthMode
  cuit_masked: string
  punto_de_venta: number
  razon_social: string
  tipo_iva: TipoIva
  production_mode: boolean
  last_cae_date: string | null
  has_certificate: boolean
  has_access_token: boolean
}

export interface SaveAfipCredentialsDto {
  auth_mode: AfipAuthMode
  cuit: string
  certificate?: string
  private_key?: string
  access_token?: string
  punto_de_venta: number
  razon_social: string
  tipo_iva: TipoIva
  production_mode: boolean
}

export interface ElectronicInvoice {
  id: string
  tenant_id: string
  sale_id: string | null
  punto_de_venta: number
  tipo_comprobante: number
  numero_comprobante: number
  cae: string
  cae_expiration: string
  fecha_comprobante: string
  concepto: number
  doc_tipo_receptor: number
  doc_nro_receptor: number
  nombre_receptor: string | null
  importe_total: number
  importe_neto: number
  importe_iva: number
  alicuota_iva: number | null
  moneda: string
  afip_response: Record<string, unknown> | null
  is_test: boolean
  created_at: string
  updated_at: string
}

export interface GenerateInvoiceDto {
  sale_id?: string
  concepto: number
  doc_tipo_receptor: number
  doc_nro_receptor: number
  nombre_receptor?: string
  importe_total: number
  importe_neto?: number
  importe_iva?: number
  alicuota_iva?: number
}

export interface TestConnectionResponse {
  success: boolean
  message: string
  environment: string
  last_voucher: number
  tipo_comprobante: number
}

export interface ListInvoicesResponse {
  data: ElectronicInvoice[]
  total: number
  page: number
  limit: number
}

