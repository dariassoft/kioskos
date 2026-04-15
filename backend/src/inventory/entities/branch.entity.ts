import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

@Entity('branches')
export class Branch extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'boolean', default: false })
  is_main_branch: boolean;
}
