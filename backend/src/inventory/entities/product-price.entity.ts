import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';
import { PriceList } from './price-list.entity';

/**
 * Precio de un producto para una lista de precios específica.
 * Relación N:M entre Product y PriceList, con el precio como atributo.
 *
 * Ejemplo:
 *   Leche 1L — Minorista: $1500.00
 *   Leche 1L — Mayorista: $1200.00
 */
@Entity('product_prices')
export class ProductPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  product_id: string;

  @Column({ type: 'varchar', length: 36 })
  price_list_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  price: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Product, (product) => product.prices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => PriceList, { eager: true })
  @JoinColumn({ name: 'price_list_id' })
  price_list: PriceList;
}
