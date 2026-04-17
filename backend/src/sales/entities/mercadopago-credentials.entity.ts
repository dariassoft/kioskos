import { Entity, Column } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

/**
 * Credenciales de MercadoPago por tenant.
 * Permite que cada kiosko configure su propia cuenta de MP para recibir pagos.
 *
 * ⚠️ SEGURIDAD: access_token se debe almacenar encriptado en producción.
 * Por ahora se guarda en texto plano para desarrollo.
 */
@Entity('mercadopago_credentials')
export class MercadopagoCredentials extends BaseKioskosEntity {
  /** Public Key de MercadoPago (se puede mostrar en el frontend) */
  @Column({ type: 'varchar', length: 200, nullable: true })
  public_key: string | null;

  /** Access Token de MercadoPago (⚠️ SENSIBLE - encriptar en producción) */
  @Column({ type: 'varchar', length: 500, nullable: true })
  access_token: string | null;

  /** Refresh Token para renovar el Access Token (⚠️ SENSIBLE) */
  @Column({ type: 'varchar', length: 500, nullable: true })
  refresh_token: string | null;

  /** ID de usuario de MercadoPago vinculado */
  @Column({ type: 'varchar', length: 100, nullable: true })
  mp_user_id: string | null;

  /** Fecha de expiración del access_token */
  @Column({ type: 'timestamp', nullable: true })
  token_expires_at: Date | null;

  /** ID de la tienda/POS en MercadoPago */
  @Column({ type: 'varchar', length: 100, nullable: true })
  store_id: string | null;

  /** ID del punto de venta (POS) en MercadoPago */
  @Column({ type: 'varchar', length: 100, nullable: true })
  pos_id: string | null;

  /** Indica si está en modo sandbox (testing) */
  @Column({ type: 'boolean', default: true })
  is_sandbox: boolean;

  /** Indica si las credenciales están configuradas y listas */
  @Column({ type: 'boolean', default: false })
  is_configured: boolean;

  /** Última vez que se verificó la conexión con MP */
  @Column({ type: 'timestamp', nullable: true })
  last_verified_at: Date | null;
}

