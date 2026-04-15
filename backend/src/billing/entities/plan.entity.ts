import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string; // 'Emprendedor', 'Negocio', 'Profesional'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price_monthly: number;

  @Column({ type: 'int', default: 1 })
  max_branches: number;

  @Column({ type: 'int', default: 1 })
  max_users: number;

  /**
   * JSON con los módulos disponibles:
   * {
   *   "accounting": true,
   *   "multisite": false,
   *   "reports_advanced": true,
   *   "email_alerts": false,
   *   "bulk_import": true
   * }
   */
  @Column({ type: 'json', nullable: true })
  features: Record<string, boolean>;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
