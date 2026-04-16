import { Entity, Column } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

export enum AfipAuthMode {
  CERTIFICATE = 'certificate',  // cert + key propios
  ACCESS_TOKEN = 'access_token', // token de AfipSDK.com
}

export enum TipoIva {
  MONOTRIBUTISTA = 'monotributista',
  RESPONSABLE_INSCRIPTO = 'responsable_inscripto',
}

/**
 * Credenciales AFIP por tenant (encriptadas en base de datos).
 *
 * ⚠️ SEGURIDAD: cert_encrypted, key_encrypted y access_token_encrypted
 * se almacenan con AES-256-CBC usando AFIP_ENCRYPTION_KEY del entorno.
 * Nunca se devuelven al frontend en texto plano.
 */
@Entity('afip_credentials')
export class AfipCredentials extends BaseKioskosEntity {
  /**
   * Modo de autenticación:
   *  - certificate: usa certificado + clave privada propios
   *  - access_token: usa token de AfipSDK.com (más simple, recomendado para empezar)
   */
  @Column({
    type: 'enum',
    enum: AfipAuthMode,
    default: AfipAuthMode.CERTIFICATE,
  })
  auth_mode: AfipAuthMode;

  /** CUIT del emisor (11 dígitos) — encriptado */
  @Column({ type: 'varchar', length: 500 })
  cuit_encrypted: string;

  /**
   * Certificado X.509 en formato PEM — encriptado.
   * Solo se usa si auth_mode = certificate.
   */
  @Column({ type: 'text', nullable: true })
  certificate_encrypted: string | null;

  /**
   * Clave privada en formato PEM — encriptada.
   * Solo se usa si auth_mode = certificate.
   */
  @Column({ type: 'text', nullable: true })
  private_key_encrypted: string | null;

  /**
   * Access Token de AfipSDK.com — encriptado.
   * Solo se usa si auth_mode = access_token.
   */
  @Column({ type: 'varchar', length: 1000, nullable: true })
  access_token_encrypted: string | null;

  /** Número de punto de venta habilitado en AFIP (1-99999) */
  @Column({ type: 'int' })
  punto_de_venta: number;

  /** Razón social del emisor */
  @Column({ type: 'varchar', length: 200 })
  razon_social: string;

  /** Tipo de IVA del emisor (determina el tipo de factura a emitir) */
  @Column({
    type: 'enum',
    enum: TipoIva,
    default: TipoIva.MONOTRIBUTISTA,
  })
  tipo_iva: TipoIva;

  /**
   * Modo producción.
   * false = Homologación (testing de AFIP) — recomendado inicialmente.
   * true  = Producción real AFIP.
   */
  @Column({ type: 'boolean', default: false })
  production_mode: boolean;

  /** Indica si las credenciales fueron configuradas correctamente */
  @Column({ type: 'boolean', default: false })
  is_configured: boolean;

  /** Última fecha en que se generó un CAE exitosamente */
  @Column({ type: 'timestamp', nullable: true })
  last_cae_date: Date | null;
}

