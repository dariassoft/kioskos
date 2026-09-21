import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Unit } from './unit.entity';
import { Category } from './category.entity';
import { ProductPrice } from './product-price.entity';
import { Inventory } from './inventory.entity';
import { Supplier } from '../../purchases/entities/supplier.entity';
import { Brand } from './brand.entity';

/**
 * Tipo de producto según su rol en el negocio:
 * - standard:     compra y venta directa (default, comportamiento histórico)
 * - raw_material: insumo/materia prima — se compra pero NO se vende directo (oculto en el POS)
 * - fractionated: se obtiene por fraccionamiento de otro producto (ej: bolsa 1kg desde bolsa 20kg)
 * - elaborated:   se obtiene por elaboración a partir de insumos (ej: milanesas desde pechuga)
 */
export enum ProductType {
  STANDARD = 'standard',
  RAW_MATERIAL = 'raw_material',
  FRACTIONATED = 'fractionated',
  ELABORATED = 'elaborated',
}

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

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 21 })
  vat_rate: number; // Alícuota de IVA aplicable al producto

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  brand_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  supplier_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 5.0 })
  min_stock_alert: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'enum', enum: ProductType, default: ProductType.STANDARD })
  product_type: ProductType;

  @ManyToOne(() => Unit, { eager: true, nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @ManyToOne(() => Category, { eager: true, nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Brand, { eager: true, nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToOne(() => Supplier, { eager: false, nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @OneToMany(() => ProductPrice, (pp) => pp.product, { eager: true })
  prices: ProductPrice[];

  @OneToMany(() => Inventory, (inv) => inv.product)
  inventory_records: Inventory[];
}
