import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseReturnItem } from './purchase-return-item.entity';

export enum PurchaseReturnSettlementMethod {
  CREDIT_NOTE = 'credit_note',
  CASH_REFUND = 'cash_refund',
  BANK_REFUND = 'bank_refund',
}

@Entity('purchase_returns')
export class PurchaseReturn extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 36 })
  purchase_order_id: string;

  @Column({ type: 'varchar', length: 36 })
  supplier_id: string;

  @Column({ type: 'varchar', length: 36 })
  branch_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  net_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  vat_amount: number;

  @Column({ type: 'varchar', length: 500 })
  reason: string;

  @Column({ type: 'enum', enum: PurchaseReturnSettlementMethod, default: PurchaseReturnSettlementMethod.CREDIT_NOTE })
  settlement_method: PurchaseReturnSettlementMethod;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  refund_amount: number;

  @ManyToOne(() => PurchaseOrder)
  @JoinColumn({ name: 'purchase_order_id' })
  purchase_order: PurchaseOrder;

  @OneToMany(() => PurchaseReturnItem, (item) => item.purchase_return, { cascade: true, eager: true })
  items: PurchaseReturnItem[];
}
