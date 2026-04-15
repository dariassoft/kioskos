import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

/**
 * Entidad base de Kioskos & Despenzas
 * TODAS las entidades de negocio deben extender esta clase.
 *
 * Provee:
 *  - id: UUID auto-generado
 *  - tenant_id: Discriminador multi-tenant CRÍTICO (siempre del JWT, nunca del body)
 *  - created_at / updated_at: Timestamps automáticos
 */
export abstract class BaseKioskosEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, nullable: false })
  tenant_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
