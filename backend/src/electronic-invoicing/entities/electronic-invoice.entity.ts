import { Entity, Column } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';

/**
 * Tipos de comprobante AFIP:
 *  1  = Factura A (Resp. Inscripto → Resp. Inscripto)
 *  6  = Factura B (Resp. Inscripto → Consumidor Final / Exento)
 *  11 = Factura C (Monotributista → cualquier receptor)
 */
@Entity('electronic_invoices')
export class ElectronicInvoice extends BaseKioskosEntity {
  /** Venta asociada (opcional — puede generarse manualmente) */
  @Column({ type: 'varchar', length: 36, nullable: true })
  sale_id: string | null;

  /** Punto de venta usado para emitir */
  @Column({ type: 'int' })
  punto_de_venta: number;

  /** Tipo de comprobante (1=A, 6=B, 11=C) */
  @Column({ type: 'int' })
  tipo_comprobante: number;

  /** Número de comprobante secuencial asignado por AFIP */
  @Column({ type: 'bigint' })
  numero_comprobante: number;

  /** CAE (Código de Autorización Electrónico) emitido por AFIP */
  @Column({ type: 'varchar', length: 30 })
  cae: string;

  /** Fecha de vencimiento del CAE */
  @Column({ type: 'date' })
  cae_expiration: Date;

  /** Fecha del comprobante */
  @Column({ type: 'date' })
  fecha_comprobante: Date;

  /** Concepto: 1=Productos, 2=Servicios, 3=Ambos */
  @Column({ type: 'int', default: 1 })
  concepto: number;

  /** Tipo de documento receptor: 80=CUIT, 96=DNI, 99=Sin especificar */
  @Column({ type: 'int', default: 99 })
  doc_tipo_receptor: number;

  /** Número de documento receptor (0 para consumidor final) */
  @Column({ type: 'bigint', default: 0 })
  doc_nro_receptor: number;

  /** Nombre / razón social del receptor */
  @Column({ type: 'varchar', length: 200, nullable: true })
  nombre_receptor: string | null;

  /** Importe total del comprobante */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  importe_total: number;

  /** Importe neto gravado (Responsable Inscripto) */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  importe_neto: number;

  /** Importe de IVA (Responsable Inscripto) */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  importe_iva: number;

  /** Alícuota de IVA: 3=0%, 4=10.5%, 5=21%, 6=27% */
  @Column({ type: 'int', nullable: true })
  alicuota_iva: number | null;

  /** Moneda: PES = Pesos Argentinos */
  @Column({ type: 'varchar', length: 3, default: 'PES' })
  moneda: string;

  /** Respuesta completa de AFIP (para auditoría) */
  @Column({ type: 'json', nullable: true })
  afip_response: Record<string, unknown> | null;

  /** true si fue generado en homologación (testing) */
  @Column({ type: 'boolean', default: false })
  is_test: boolean;
}

