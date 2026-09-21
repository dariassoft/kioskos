import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { SaleReturn } from './sale-return.entity';

@Entity('sale_return_items')
export class SaleReturnItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'varchar', length: 36 })
  sale_return_id: string;

  @Column({ type: 'varchar', length: 36 })
  product_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  vat_rate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  net_subtotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  vat_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  subtotal: number;

  @ManyToOne(() => SaleReturn, (saleReturn) => saleReturn.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_return_id' })
  sale_return: SaleReturn;
}
