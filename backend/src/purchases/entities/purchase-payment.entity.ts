import { Entity, Column } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

export enum PurchasePaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  BANK = 'bank',
}

@Entity('purchase_payments')
export class PurchasePayment extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 36 })
  purchase_order_id: string;

  @Column({ type: 'varchar', length: 36 })
  supplier_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PurchasePaymentMethod })
  payment_method: PurchasePaymentMethod;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;
}