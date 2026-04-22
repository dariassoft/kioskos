import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  FAILED = 'failed',
}

@Entity('billing_history')
export class BillingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  payment_status: PaymentStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method: string | null; // 'MercadoPago', 'Transferencia'

  @Column({ type: 'varchar', length: 255, nullable: true })
  invoice_url: string | null;

  // ==========================================
  // NUEVOS CAMPOS — Reestructuración Billing
  // ==========================================

  /** Plan al que corresponde este cobro */
  @Column({ type: 'varchar', length: 36, nullable: true })
  plan_id: string | null;

  /** Nombre del plan (snapshot para auditoría) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  plan_name: string | null;

  /** Inicio del período facturado */
  @Column({ type: 'date', nullable: true })
  billing_period_start: Date | null;

  /** Fin del período facturado */
  @Column({ type: 'date', nullable: true })
  billing_period_end: Date | null;

  /** Si fue prorrateo del primer mes */
  @Column({ type: 'boolean', default: false })
  is_prorated: boolean;

  /** Promoción aplicada (si la hubo) */
  @Column({ type: 'varchar', length: 36, nullable: true })
  promotion_id: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
