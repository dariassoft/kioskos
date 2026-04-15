import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Product } from './product.entity';
import { Branch } from './branch.entity';

/**
 * Stock de un producto en una sucursal específica.
 * Es la tabla pivote clave del inventario multisucursal.
 *
 * Regla: Cada combinación (tenant_id + product_id + branch_id) es única.
 * El sistema emite 'stock.reduced' cuando stock_quantity <= min_stock_alert.
 */
@Entity('inventory')
export class Inventory extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 36 })
  product_id: string;

  @Column({ type: 'varchar', length: 36 })
  branch_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  stock_quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 5.0 })
  min_stock_alert: number; // Umbral mínimo para disparar alerta

  @Column({ type: 'timestamp', nullable: true })
  last_restock_date: Date;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Branch, { eager: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
