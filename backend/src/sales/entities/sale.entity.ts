import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Customer } from './customer.entity';
import { SaleItem } from './sale-item.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  CREDIT_CLIENT = 'credit_client',
}

export enum SaleStatus {
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  PENDING = 'pending',
}

@Entity('sales')
export class Sale extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 36 })
  branch_id: string;

  @Column({ type: 'varchar', length: 36 })
  user_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  customer_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH })
  payment_method: PaymentMethod;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus;

  @ManyToOne(() => Customer, (customer) => customer.sales, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true, eager: true })
  items: SaleItem[];
}
