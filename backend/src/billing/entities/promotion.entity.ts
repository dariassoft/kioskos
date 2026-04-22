import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // "Black Friday", "Fin de Semana Patrio"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['percentage', 'fixed_price'], default: 'percentage' })
  discount_type: 'percentage' | 'fixed_price';

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  discount_value: number; // 30 (si %) o 9999 (si precio fijo)

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp' })
  end_date: Date;

  @Column({ type: 'int', nullable: true })
  max_uses: number | null; // NULL = ilimitado

  @Column({ type: 'int', default: 0 })
  current_uses: number;

  @Column({ type: 'int', default: 1 })
  promo_duration_months: number; // Cuántos meses dura el precio promocional

  @Column({ type: 'json', nullable: true })
  applies_to_plan_ids: string[] | null; // NULL o [] = todos los planes

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
