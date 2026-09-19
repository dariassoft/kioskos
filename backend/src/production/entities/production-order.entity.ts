import { Entity, Column, ManyToOne, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Product } from '../../inventory/entities/product.entity';
import { Recipe } from './recipe.entity';

export enum ProductionStatus {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('production_orders')
export class ProductionOrder extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 36 })
  branch_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  recipe_id: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  user_id: string | null;

  @Column({ type: 'enum', enum: ProductionStatus, default: ProductionStatus.COMPLETED })
  status: ProductionStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_input_cost: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  @ManyToOne(() => Recipe, { eager: false, nullable: true })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe | null;

  @OneToMany(() => ProductionInput, (input) => input.production_order, { cascade: true })
  inputs: ProductionInput[];

  @OneToMany(() => ProductionOutput, (output) => output.production_order, { cascade: true })
  outputs: ProductionOutput[];
}

@Entity('production_inputs')
export class ProductionInput {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  production_order_id: string;

  @Column({ type: 'varchar', length: 36 })
  product_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unit_cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @ManyToOne(() => ProductionOrder, (order) => order.inputs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'production_order_id' })
  production_order: ProductionOrder;

  @ManyToOne(() => Product, { eager: true, nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}

@Entity('production_outputs')
export class ProductionOutput {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  production_order_id: string;

  @Column({ type: 'varchar', length: 36 })
  product_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity: number;

  // Costo unitario calculado por prorrateo del costo de insumos (o manual)
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unit_cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @ManyToOne(() => ProductionOrder, (order) => order.outputs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'production_order_id' })
  production_order: ProductionOrder;

  @ManyToOne(() => Product, { eager: true, nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
