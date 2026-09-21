import { Entity, Column, OneToMany } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('suppliers')
export class Supplier extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contact_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tax_id: string;

  @Column({ type: 'boolean', default: false })
  current_account_enabled: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  opening_balance: number;

  @OneToMany(() => PurchaseOrder, (order) => order.supplier)
  purchase_orders: PurchaseOrder[];
}
