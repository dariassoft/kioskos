import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
  PAST_DUE = 'past_due',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 36 })
  plan_id: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'boolean', default: true })
  auto_renew: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_payment_date: Date;

  @Column({ type: 'date', nullable: true })
  next_billing_date: Date;

  @Column({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;

  @Column({ name: 'discount_ends_at', type: 'date', nullable: true })
  discount_ends_at: Date | null;

  // ==========================================
  // NUEVOS CAMPOS — Reestructuración Billing
  // ==========================================

  /** Precio que aceptó el suscriptor al momento de contratar (no cambia si se modifica el plan) */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  locked_price: number | null;

  /** Nombre del plan al momento de suscribirse (snapshot) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  locked_plan_name: string | null;

  /** Día fijo de facturación mensual (default: 10) */
  @Column({ type: 'int', default: 10 })
  billing_day: number;

  /** Estado de la suscripción */
  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  /** Fecha en que el usuario pidió cancelar */
  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  /** Motivo de cancelación */
  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  /** ID de la promoción aplicada (si la hubo) */
  @Column({ type: 'varchar', length: 36, nullable: true })
  promotion_id: string | null;

  /** Precio que aplica luego de que termine la promo */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price_after_promo: number | null;

  /** Fecha en la que termina el precio promocional y empieza el precio normal */
  @Column({ type: 'date', nullable: true })
  promo_ends_at: Date | null;

  /** ID de la suscripción recurrente de MercadoPago (para poder cancelarla) */
  @Column({ type: 'varchar', length: 255, nullable: true })
  mp_preapproval_id: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
