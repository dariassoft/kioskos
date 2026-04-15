import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Supplier } from './supplier.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

export enum PurchaseOrderStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

@Entity('purchase_orders')
export class PurchaseOrder extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 36 })
  supplier_id: string;

  @Column({ type: 'varchar', length: 36 })
  branch_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.PENDING })
  status: PurchaseOrderStatus;

  @ManyToOne(() => Supplier, (supplier) => supplier.purchase_orders)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchase_order, { cascade: true, eager: true })
  items: PurchaseOrderItem[];
}
