import { Entity, Column } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

export enum PaymentAccountType {
  ALIAS = 'alias',
  CBU = 'cbu',
  OTHER = 'other',
}

@Entity('payment_accounts')
export class PaymentAccount extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string; // Ej: "Mercado Pago", "Banco Galicia"

  @Column({
    type: 'enum',
    enum: PaymentAccountType,
    default: PaymentAccountType.ALIAS,
  })
  type: PaymentAccountType;

  @Column({ type: 'varchar', length: 100 })
  value: string; // El alias o CBU real

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
