import { Entity, Column, OneToMany } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Sale } from './sale.entity';

@Entity('customers')
export class Customer extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  credit_limit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  current_debt: number;

  @OneToMany(() => Sale, (sale) => sale.customer)
  sales: Sale[];
}
