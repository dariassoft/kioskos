import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PendingSubscriptionStatus {
  PENDING = 'pending',       // Preferencia creada, esperando pago
  APPROVED = 'approved',     // Pago confirmado por MP webhook
  REJECTED = 'rejected',     // Pago rechazado o fallido
  EXPIRED = 'expired',       // Expiró sin pago (>24h)
  MANUAL_PENDING = 'manual_pending', // Transferencia manual sin verificar
  MANUAL_APPROVED = 'manual_approved', // Transferencia manual verificada
}

/**
 * Almacena la intención de suscripción ANTES de que el pago sea confirmado.
 * Una vez confirmado el pago, se crea el Tenant + User y se activa la suscripción.
 */
@Entity('pending_subscriptions')
export class PendingSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── Datos del plan elegido ───────────────────────────────────────────────
  @Column({ type: 'varchar', length: 36 })
  plan_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number; // precio al momento del checkout

  // ─── Datos del nuevo cliente ─────────────────────────────────────────────
  @Column({ type: 'varchar', length: 150 })
  business_name: string;

  @Column({ type: 'varchar', length: 100 })
  owner_email: string;

  @Column({ type: 'varchar', length: 100 })
  owner_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  owner_phone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tax_id: string; // CUIT/CUIL

  // ─── Contraseña temporal hasheada ────────────────────────────────────────
  @Column({ type: 'varchar', length: 255 })
  temp_password_hash: string;

  // ─── Estado del proceso de pago ──────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: PendingSubscriptionStatus,
    default: PendingSubscriptionStatus.PENDING,
  })
  status: PendingSubscriptionStatus;

  @Column({ type: 'varchar', length: 50 })
  payment_method: string; // 'mercadopago' | 'transfer'

  /** El cliente autorizó cobros mensuales automáticos en MercadoPago. */
  @Column({ type: 'boolean', default: false })
  auto_renew: boolean;

  // ─── Datos de MercadoPago ─────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 255, nullable: true })
  mp_preference_id: string; // ID de la preferencia MP

  @Column({ type: 'varchar', length: 100, nullable: true })
  mp_payment_id: string; // ID del pago confirmado

  @Column({ type: 'varchar', length: 255, nullable: true })
  mp_init_point: string; // URL de pago MP Checkout Pro

  // ─── Datos de transferencia manual (si aplica) ────────────────────────────
  @Column({ type: 'varchar', length: 100, nullable: true })
  transfer_alias: string; // Alias/CBU al que transfirió

  @Column({ type: 'text', nullable: true })
  transfer_notes: string; // Número de comprobante, referencia, etc.

  @Column({ type: 'longtext', nullable: true })
  transfer_voucher: string; // Comprobante enviado como data URL (imagen/PDF)

  // ─── Tenant creado tras confirmación ─────────────────────────────────────
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenant_id: string; // Populated when account is created

  @Column({ name: 'referred_by_code', type: 'varchar', length: 10, nullable: true })
  referred_by_code: string;

  // ─── Timestamps ───────────────────────────────────────────────────────────
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

