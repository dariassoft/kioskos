import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

/**
 * Categoría de productos (ej: Lácteos, Bebidas, Almacén, Limpieza).
 * Organiza el catálogo y facilita la búsqueda en el POS.
 */
@Entity('categories')
export class Category extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string; // Hex para el badge en la UI (#3b82f6)

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string; // Nombre de icono (lucide)
}
