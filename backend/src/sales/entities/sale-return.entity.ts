import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Sale } from './sale.entity';
import { SaleReturnItem } from './sale-return-item.entity';

@Entity('sale_returns')
export class SaleReturn extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 36 })
  sale_id: string;

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

  @ManyToOne(() => Sale)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @OneToMany(() => SaleReturnItem, (item) => item.sale_return, { cascade: true, eager: true })
  items: SaleReturnItem[];
}
