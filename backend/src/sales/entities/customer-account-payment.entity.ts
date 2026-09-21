import { Entity, Column } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

export enum CustomerPaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  BANK = 'bank',
}

@Entity('customer_account_payments')
export class CustomerAccountPayment extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 36 })
  customer_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: CustomerPaymentMethod, default: CustomerPaymentMethod.CASH })
  payment_method: CustomerPaymentMethod;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;
}
