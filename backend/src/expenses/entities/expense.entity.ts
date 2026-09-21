import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { ExpenseCategory } from './expense-category.entity';

export enum ExpensePaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
}

export enum ExpenseStatus {
  ACTIVE = 'active',
  VOIDED = 'voided',
}

@Entity('expenses')
export class Expense extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 36 })
  category_id: string;

  @ManyToOne(() => ExpenseCategory, (cat) => cat.expenses, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: ExpenseCategory;

  @Column({ type: 'varchar', length: 36, nullable: true })
  branch_id: string | null;

  @Column({ type: 'enum', enum: ExpensePaymentMethod, default: ExpensePaymentMethod.CASH })
  payment_method: ExpensePaymentMethod;

  @Column({ type: 'varchar', length: 100, nullable: true })
  receipt_number: string | null; // Nro de comprobante/factura

  @Column({ type: 'text', nullable: true })
  notes: string | null; // Observaciones: cuenta, tarjeta usada, etc.

  @Column({ type: 'longtext', nullable: true })
  receipt_image: string | null; // Foto del comprobante (base64)

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.ACTIVE })
  status: ExpenseStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  void_reason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  voided_at: Date | null;
}
