import { Entity, Column } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

@Entity('accounting_ledgers')
export class AccountingLedger extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 36, nullable: true })
  reference_id: string; // Puede ser el ID de una venta, de una compra, o null si es manual

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  account_name: string; // Ej: 'Ventas', 'Caja', 'Mercadería', 'Proveedores'

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  debit: number; // Debe

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  credit: number; // Haber
}
