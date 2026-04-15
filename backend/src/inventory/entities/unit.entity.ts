import { Entity, Column } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

/**
 * Unidades de medida del catálogo del negocio.
 * Ejemplos: Kilogramo (Kg), Unidad (Un), Litro (Lt), Metro (m)
 */
@Entity('units')
export class Unit extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  abbreviation: string; // 'Kg', 'Un', 'Lt'
}
