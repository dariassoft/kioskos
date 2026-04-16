-- ==========================================
-- FASE 9: FACTURACIÓN ELECTRÓNICA AFIP
-- ==========================================
CREATE TABLE IF NOT EXISTS afip_credentials (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  auth_mode ENUM('certificate', 'access_token') NOT NULL DEFAULT 'certificate',
  cuit_encrypted VARCHAR(500) NOT NULL,
  certificate_encrypted TEXT NULL,
  private_key_encrypted TEXT NULL,
  access_token_encrypted VARCHAR(1000) NULL,
  punto_de_venta INT NOT NULL,
  razon_social VARCHAR(200) NOT NULL,
  tipo_iva ENUM('monotributista', 'responsable_inscripto') NOT NULL DEFAULT 'monotributista',
  production_mode BOOLEAN NOT NULL DEFAULT FALSE,
  is_configured BOOLEAN NOT NULL DEFAULT FALSE,
  last_cae_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  UNIQUE KEY unique_tenant_config (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS electronic_invoices (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  sale_id VARCHAR(36) NULL,
  punto_de_venta INT NOT NULL,
  tipo_comprobante INT NOT NULL,
  numero_comprobante BIGINT NOT NULL,
  cae VARCHAR(30) NOT NULL,
  cae_expiration DATE NOT NULL,
  fecha_comprobante DATE NOT NULL,
  concepto INT NOT NULL DEFAULT 1,
  doc_tipo_receptor INT NOT NULL DEFAULT 99,
  doc_nro_receptor BIGINT NOT NULL DEFAULT 0,
  nombre_receptor VARCHAR(200) NULL,
  importe_total DECIMAL(15,2) NOT NULL,
  importe_neto DECIMAL(15,2) NOT NULL DEFAULT 0,
  importe_iva DECIMAL(15,2) NOT NULL DEFAULT 0,
  alicuota_iva INT NULL,
  moneda VARCHAR(3) NOT NULL DEFAULT 'PES',
  afip_response JSON NULL,
  is_test BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_sale (sale_id),
  INDEX idx_fecha (fecha_comprobante),
  UNIQUE KEY unique_comprobante (tenant_id, punto_de_venta, tipo_comprobante, numero_comprobante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
UPDATE plans SET features = JSON_SET(features, '$.electronic_invoicing', false) WHERE id = 'plan-emprendedor-001';
UPDATE plans SET features = JSON_SET(features, '$.electronic_invoicing', true) WHERE id = 'plan-negocio-001';
UPDATE plans SET features = JSON_SET(features, '$.electronic_invoicing', true) WHERE id = 'plan-profesional-001';
SELECT '✅ Migración Fase 9 completada' AS resultado;
