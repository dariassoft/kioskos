import { Entity, Column } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

@Entity('cash_registers')
export class CashRegister extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 36 })
  branch_id: string;

  @Column({ type: 'varchar', length: 36 })
  user_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  opening_balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  closing_balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  cash_sales: number;

  @Column({ type: 'enum', enum: ['open', 'closed'], default: 'open' })
  status: 'open' | 'closed';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  opened_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at: Date;
}
