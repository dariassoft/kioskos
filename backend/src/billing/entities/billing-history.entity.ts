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
  payment_method: string; // 'MercadoPago', 'Transferencia'

  @Column({ type: 'varchar', length: 255, nullable: true })
  invoice_url: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
