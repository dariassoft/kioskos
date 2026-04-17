import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Customer } from './customer.entity';
import { SaleItem } from './sale-item.entity';

export enum PaymentMethod {
  CASH = 'cash',                    // Efectivo
  DEBIT_CARD = 'debit_card',        // Tarjeta de débito
  CREDIT_CARD = 'credit_card',      // Tarjeta de crédito
  TRANSFER = 'transfer',            // Transferencia bancaria
  QR_MERCADOPAGO = 'qr_mercadopago', // QR de MercadoPago
  LINK_MERCADOPAGO = 'link_mercadopago', // Link de pago MercadoPago
  CREDIT_CLIENT = 'credit_client',  // Fiado / Cuenta corriente
}

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum SaleStatus {
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  PENDING = 'pending',
}

@Entity('sales')
export class Sale extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 36 })
  branch_id: string;

  @Column({ type: 'varchar', length: 36 })
  user_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  customer_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH })
  payment_method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.CONFIRMED })
  payment_status: PaymentStatus;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus;

  // ==========================================
  // DETALLES DE PAGO (Payment Details)
  // ==========================================

  /** ID de transacción de MercadoPago (para QR/Link) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  mp_payment_id: string | null;

  /** Estado del pago de MercadoPago (approved, pending, rejected, etc) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  mp_payment_status: string | null;

  /** Nombre del pagador (para transferencias/MP) */
  @Column({ type: 'varchar', length: 200, nullable: true })
  payer_name: string | null;

  /** Email del pagador (para MP) */
  @Column({ type: 'varchar', length: 200, nullable: true })
  payer_email: string | null;

  /** Comprobante de transferencia / CBU origen */
  @Column({ type: 'varchar', length: 100, nullable: true })
  transfer_voucher: string | null;

  /** Banco / billetera origen (para transferencias) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  transfer_origin: string | null;

  /** Últimos 4 dígitos de tarjeta (para débito/crédito) */
  @Column({ type: 'varchar', length: 4, nullable: true })
  card_last_digits: string | null;

  /** Marca de tarjeta (Visa, Mastercard, etc) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  card_brand: string | null;

  /** Número de autorización (para tarjetas) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  authorization_code: string | null;

  /** Notas adicionales del pago */
  @Column({ type: 'text', nullable: true })
  payment_notes: string | null;

  /** Fecha de verificación del pago (para transferencias pendientes) */
  @Column({ type: 'timestamp', nullable: true })
  payment_verified_at: Date | null;

  /** URL/Ruta de la imagen del comprobante de transferencia */
  @Column({ type: 'varchar', length: 255, nullable: true })
  voucher_image_url: string | null;

  @ManyToOne(() => Customer, (customer) => customer.sales, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true, eager: true })
  items: SaleItem[];
}
