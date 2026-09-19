import { Entity, Column, ManyToOne, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Product } from '../../inventory/entities/product.entity';

export enum RecipeType {
  FRACTIONING = 'fractioning',   // Fraccionamiento: 1 insumo → unidades más chicas (ej: bolsa 20kg → bolsas 1kg)
  ELABORATION = 'elaboration',   // Elaboración: insumos → producto vendible (ej: pechuga → milanesas)
}

@Entity('recipes')
export class Recipe extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'enum', enum: RecipeType, default: RecipeType.ELABORATION })
  type: RecipeType;

  // Producto que se obtiene al ejecutar la receta (fractionated o elaborated)
  @Column({ type: 'varchar', length: 36 })
  output_product_id: string;

  // Cantidad que se obtiene por cada tanda (ej: 20 bolsas de 1kg por bolsa de 20kg)
  @Column({ type: 'decimal', precision: 15, scale: 3, default: 1 })
  output_quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Product, { eager: true, nullable: false })
  @JoinColumn({ name: 'output_product_id' })
  output_product: Product;

  @OneToMany(() => RecipeItem, (item) => item.recipe, { cascade: true, eager: true })
  items: RecipeItem[];
}

@Entity('recipe_items')
export class RecipeItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  recipe_id: string;

  // Insumo (típicamente un producto raw_material) y cantidad APROXIMADA por tanda
  @Column({ type: 'varchar', length: 36 })
  product_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @ManyToOne(() => Product, { eager: true, nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
