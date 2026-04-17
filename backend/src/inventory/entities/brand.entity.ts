import { Entity, Column, OneToMany } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Product } from './product.entity';

@Entity('brands')
export class Brand extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];
}
