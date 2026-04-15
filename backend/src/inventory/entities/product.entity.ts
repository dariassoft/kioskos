import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Unit } from './unit.entity';
import { Category } from './category.entity';
import { ProductPrice } from './product-price.entity';
import { Inventory } from './inventory.entity';

/**
 * Producto base del catálogo.
 * El precio NO se guarda aquí — está en ProductPrice (relación con PriceList).
 * El stock NO se guarda aquí — está en Inventory (por sucursal).
 */
@Entity('products')
export class Product extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string; // EAN-13 / EAN-8 / Code128

  @Column({ type: 'varchar', length: 50, nullable: true })
  internal_code: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  unit_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  category_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cost_price: number; // Precio de costo (para calcular margen)

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Unit, { eager: true, nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @ManyToOne(() => Category, { eager: true, nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductPrice, (pp) => pp.product, { eager: true })
  prices: ProductPrice[];
}
