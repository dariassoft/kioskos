import { Entity, Column } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

/**
 * Lista de precios del negocio.
 * Ejemplos: Minorista (default), Mayorista, Personal, etc.
 * Cada producto puede tener un precio diferente por lista.
 */
@Entity('price_lists')
export class PriceList extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;
}
