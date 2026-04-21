import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import {
  AfipCredentials,
  AfipAuthMode,
  TipoIva,
} from './entities/afip-credentials.entity';
import { ElectronicInvoice } from './entities/electronic-invoice.entity';
import { SaveAfipCredentialsDto, GenerateInvoiceDto } from './dto/afip.dto';
import { BillingService } from '@billing/billing.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { Sale } from '@sales/entities/sale.entity';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Afip = require('@afipsdk/afip.js');

/**
 * Tipos de comprobante AFIP según tipo de contribuyente
 * Monotributista emite siempre Factura C (11)
 * Responsable Inscripto emite:
 *   - Factura A (1) si receptor es RI (doc_tipo=80)
 *   - Factura B (6) en cualquier otro caso
 */
const TIPO_COMPROBANTE = {
  FACTURA_A: 1,
  FACTURA_B: 6,
  FACTURA_C: 11,
} as const;

/** Alícuotas de IVA disponibles en AFIP */
const IVA_ID = {
  EXENTO: 3,    // 0%
  IVA_10_5: 4,  // 10.5%
  IVA_21: 5,    // 21%
  IVA_27: 6,    // 27%
} as const;

@Injectable()
export class ElectronicInvoicingService {
  private readonly logger = new Logger(ElectronicInvoicingService.name);

  /** Clave de cifrado AES-256 derivada de AFIP_ENCRYPTION_SECRET */
  private readonly encryptionKey: Buffer;

  constructor(
    @InjectRepository(AfipCredentials)
    private readonly credentialsRepo: Repository<AfipCredentials>,
    @InjectRepository(ElectronicInvoice)
    private readonly invoiceRepo: Repository<ElectronicInvoice>,
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {
    // Derivar clave de 32 bytes desde la variable de entorno usando scrypt
    const secret =
      this.configService.get<string>('AFIP_ENCRYPTION_SECRET') ||
      'dev_afip_secret_change_in_production!!';
    this.encryptionKey = crypto.scryptSync(secret, 'afip_salt_v1', 32) as Buffer;
  }

  // ==========================================
  // ENCRIPTACIÓN / DESENCRIPTACIÓN
  // ==========================================

  /**
   * Encripta texto plano con AES-256-CBC.
   * Prefija el IV al resultado en hex: `iv:encrypted`
   */
  private encrypt(text: string): string {
    const iv = Buffer.from(crypto.randomBytes(16));
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv, undefined);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${Buffer.from(iv).toString('hex')}:${encrypted}`;
  }

  /**
   * Desencripta texto con AES-256-CBC.
   * Espera formato `iv:encrypted` en hex.
   */
  private decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      this.encryptionKey,
      iv,
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // ==========================================
  // VALIDACIÓN DE FEATURE
  // ==========================================

  /**
   * Verifica que el tenant tenga el módulo `electronic_invoicing` habilitado.
   * Lanza ForbiddenException si no tiene acceso.
   */
  private async assertFeatureEnabled(tenantId: string): Promise<void> {
    const enabled = await this.billingService.isFeatureEnabled(
      tenantId,
      'electronic_invoicing',
    );
    if (!enabled) {
      throw new ForbiddenException(
        'El módulo de Facturación Electrónica no está incluido en tu plan actual. Actualizá tu suscripción.',
      );
    }
  }

  // ==========================================
  // GESTIÓN DE CREDENCIALES
  // ==========================================

  /**
   * Guarda o actualiza las credenciales AFIP del tenant.
   * Encripta todos los campos sensibles antes de persistir.
   */
  async saveCredentials(
    dto: SaveAfipCredentialsDto,
    tenantId: string,
  ): Promise<{ message: string; is_configured: boolean }> {
    await this.assertFeatureEnabled(tenantId);

    // Validaciones según modo de autenticación
    if (dto.auth_mode === AfipAuthMode.CERTIFICATE) {
      if (!dto.certificate || !dto.private_key) {
        throw new BadRequestException(
          'Para el modo Certificado se requiere el certificado (.crt) y la clave privada (.key)',
        );
      }
    } else if (dto.auth_mode === AfipAuthMode.ACCESS_TOKEN) {
      if (!dto.access_token) {
        throw new BadRequestException(
          'Para el modo Access Token se requiere el token de AfipSDK.com / ARCA',
        );
      }
    }

    let credentials = await this.credentialsRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (!credentials) {
      credentials = this.credentialsRepo.create({ tenant_id: tenantId });
    }

    credentials.auth_mode = dto.auth_mode;
    credentials.cuit_encrypted = this.encrypt(dto.cuit.trim());
    credentials.punto_de_venta = dto.punto_de_venta;
    credentials.razon_social = dto.razon_social.trim();
    credentials.tipo_iva = dto.tipo_iva;
    credentials.production_mode = dto.production_mode;

    if (dto.auth_mode === AfipAuthMode.CERTIFICATE) {
      credentials.certificate_encrypted = this.encrypt(dto.certificate!.trim());
      credentials.private_key_encrypted = this.encrypt(dto.private_key!.trim());
      credentials.access_token_encrypted = null;
    } else {
      credentials.access_token_encrypted = this.encrypt(dto.access_token!.trim());
      credentials.certificate_encrypted = null;
      credentials.private_key_encrypted = null;
    }

    credentials.is_configured = true;
    await this.credentialsRepo.save(credentials);

    this.logger.log(
      `Credenciales AFIP guardadas para tenant ${tenantId} (modo: ${dto.auth_mode}, producción: ${dto.production_mode})`,
    );

    return {
      message: 'Credenciales AFIP guardadas correctamente',
      is_configured: true,
    };
  }

  /**
   * Devuelve los datos de configuración SIN información sensible.
   * Solo expone: auth_mode, punto_de_venta, razon_social, tipo_iva,
   * production_mode, is_configured, last_cae_date y CUIT enmascarado.
   */
  async getCredentialsSafe(tenantId: string): Promise<Record<string, unknown>> {
    const creds = await this.credentialsRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (!creds) {
      return {
        is_configured: false,
        auth_mode: AfipAuthMode.CERTIFICATE,
        production_mode: false,
        tipo_iva: TipoIva.MONOTRIBUTISTA,
      };
    }

    // Enmascarar el CUIT para mostrar en la UI
    let cuit_masked: string;
    try {
      const cuit = this.decrypt(creds.cuit_encrypted);
      cuit_masked = `${cuit.substring(0, 2)}-${cuit.substring(2, 10)}-${cuit.slice(-1)}`;
    } catch {
      cuit_masked = '*** (error al leer)';
    }

    return {
      is_configured: creds.is_configured,
      auth_mode: creds.auth_mode,
      cuit_masked,
      punto_de_venta: creds.punto_de_venta,
      razon_social: creds.razon_social,
      tipo_iva: creds.tipo_iva,
      production_mode: creds.production_mode,
      last_cae_date: creds.last_cae_date,
      has_certificate: !!creds.certificate_encrypted,
      has_access_token: !!creds.access_token_encrypted,
    };
  }

  /**
   * Construye una instancia del SDK de AFIP con las credenciales del tenant.
   * Las credenciales se desencriptan solo en memoria, nunca se persisten en texto plano.
   */
  private async buildAfipInstance(tenantId: string): Promise<any> {
    const creds = await this.credentialsRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (!creds || !creds.is_configured) {
      throw new BadRequestException(
        'No hay credenciales de ARCA configuradas para este negocio. ' +
          'Configuralas en Ajustes → Facturación ARCA.',
      );
    }

    const cuit = parseInt(this.decrypt(creds.cuit_encrypted), 10);
    const afipOptions: any = {
      CUIT: cuit,
      production: creds.production_mode,
    };

    if (creds.auth_mode === AfipAuthMode.CERTIFICATE) {
      afipOptions.cert = this.decrypt(creds.certificate_encrypted!);
      afipOptions.key = this.decrypt(creds.private_key_encrypted!);
    } else {
      afipOptions.access_token = this.decrypt(creds.access_token_encrypted!);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return new Afip(afipOptions);
  }

  /**
   * Prueba la conexión con AFIP obteniendo el último comprobante.
   * Útil para verificar que las credenciales son correctas.
   */
  async testConnection(tenantId: string): Promise<Record<string, unknown>> {
    await this.assertFeatureEnabled(tenantId);
    const creds = await this.credentialsRepo.findOne({
      where: { tenant_id: tenantId },
    });
    if (!creds) {
      throw new BadRequestException('No hay credenciales configuradas');
    }

    try {
      const afip = await this.buildAfipInstance(tenantId);
      const tipoComp =
        creds.tipo_iva === TipoIva.MONOTRIBUTISTA
          ? TIPO_COMPROBANTE.FACTURA_C
          : TIPO_COMPROBANTE.FACTURA_B;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
        creds.punto_de_venta,
        tipoComp,
      );

      return {
        success: true,
        message: 'Conexión exitosa con AFIP',
        environment: creds.production_mode ? 'Producción' : 'Homologación (testing)',
        last_voucher: lastVoucher,
        tipo_comprobante: tipoComp,
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error al probar conexión AFIP para tenant ${tenantId}: ${error.message}`);
      throw new BadRequestException(
        `Error al conectar con AFIP: ${error.message}. ` +
          'Verificá que las credenciales sean correctas y que el certificado no esté vencido.',
      );
    }
  }

  // ==========================================
  // GENERACIÓN DE FACTURAS
  // ==========================================

  /**
   * Genera una factura electrónica en AFIP y la persiste en la base de datos.
   *
   * El tipo de comprobante se determina automáticamente:
   * - Monotributista siempre emite Factura C (11)
   * - Responsable Inscripto emite Factura A (1) si receptor tiene CUIT,
   *   o Factura B (6) para consumidor final / DNI
   */
  async generateInvoice(
    dto: GenerateInvoiceDto,
    tenantId: string,
  ): Promise<ElectronicInvoice> {
    await this.assertFeatureEnabled(tenantId);

    const creds = await this.credentialsRepo.findOne({
      where: { tenant_id: tenantId },
    });
    if (!creds || !creds.is_configured) {
      throw new BadRequestException(
        'Configurá las credenciales de ARCA antes de emitir facturas.',
      );
    }

    // Determinar tipo de comprobante
    const tipoComprobante = this.determinarTipoComprobante(
      creds.tipo_iva,
      dto.doc_tipo_receptor,
    );

    const afip = await this.buildAfipInstance(tenantId);

    // Obtener el último número de comprobante
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const lastVoucherNumber = await afip.ElectronicBilling.getLastVoucher(
      creds.punto_de_venta,
      tipoComprobante,
    ) as number;
    const nextVoucherNumber = lastVoucherNumber + 1;

    // Fecha del comprobante (YYYYMMDD)
    const today = new Date();
    const fechaStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Construir los datos de la factura según tipo de IVA
    const voucherData = this.buildVoucherData({
      dto,
      creds,
      tipoComprobante,
      nextVoucherNumber,
      fechaStr,
    });

    this.logger.log(
      `Emitiendo Factura ${tipoComprobante === 1 ? 'A' : tipoComprobante === 6 ? 'B' : 'C'} ` +
        `#${nextVoucherNumber} para tenant ${tenantId} (${creds.production_mode ? 'PRODUCCIÓN' : 'homologación'})`,
    );

    // Llamar a AFIP
    let afipResponse: Record<string, unknown>;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      afipResponse = await afip.ElectronicBilling.createVoucher(
        voucherData,
        true, // returnResponse = true → respuesta completa
      ) as Record<string, unknown>;
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Error AFIP al generar factura para tenant ${tenantId}: ${error.message}`,
      );
      throw new BadRequestException(
        `ARCA rechazó la factura: ${error.message}`,
      );
    }

    // Parsear respuesta
    const cae = this.extractCae(afipResponse);
    if (!cae) {
      throw new BadRequestException(
        'AFIP no devolvió un CAE válido. Verificá los datos e intentá nuevamente.',
      );
    }

    const caeExp = this.extractCaeExpiration(afipResponse);

    // Persistir la factura
    const invoice = this.invoiceRepo.create({
      tenant_id: tenantId,
      sale_id: dto.sale_id ?? null,
      punto_de_venta: creds.punto_de_venta,
      tipo_comprobante: tipoComprobante,
      numero_comprobante: nextVoucherNumber,
      cae,
      cae_expiration: caeExp,
      fecha_comprobante: today,
      concepto: dto.concepto,
      doc_tipo_receptor: dto.doc_tipo_receptor,
      doc_nro_receptor: dto.doc_nro_receptor,
      nombre_receptor: dto.nombre_receptor ?? null,
      importe_total: dto.importe_total,
      importe_neto: dto.importe_neto ?? 0,
      importe_iva: dto.importe_iva ?? 0,
      alicuota_iva: dto.alicuota_iva ?? null,
      moneda: 'PES',
      afip_response: afipResponse,
      is_test: !creds.production_mode,
    });

    const saved = await this.invoiceRepo.save(invoice);

    // Actualizar última fecha de CAE
    await this.credentialsRepo.update(
      { tenant_id: tenantId },
      { last_cae_date: new Date() },
    );

    this.logger.log(
      `Factura emitida exitosamente: CAE=${cae}, Nro=${nextVoucherNumber}`,
    );

    return saved;
  }

  // ==========================================
  // LISTADO DE FACTURAS
  // ==========================================

  async listInvoices(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: ElectronicInvoice[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const [data, total] = await this.invoiceRepo.findAndCount({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getInvoiceById(
    id: string,
    tenantId: string,
  ): Promise<ElectronicInvoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    return invoice;
  }

  /**
   * Obtiene el PDF de una factura.
   */
  async getInvoicePdf(id: string, tenantId: string): Promise<Buffer> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada');

    const creds = await this.credentialsRepo.findOne({
      where: { tenant_id: tenantId },
    });
    if (!creds) throw new NotFoundException('Configuración AFIP no encontrada');

    // Desencriptar CUIT para el PDF/QR
    const decryptedCreds = { ...creds };
    try {
      (decryptedCreds as any).cuit = this.decrypt(creds.cuit_encrypted);
    } catch (e) {
      this.logger.warn(`No se pudo desencriptar CUIT para PDF del tenant ${tenantId}`);
    }

    let sale: Sale | undefined;
    if (invoice.sale_id) {
      sale = await this.saleRepo.findOne({
        where: { id: invoice.sale_id, tenant_id: tenantId },
        relations: ['items', 'items.product', 'customer'],
      }) || undefined;
    }

    return this.invoicePdfService.generateInvoicePdf(invoice, decryptedCreds as any, sale);
  }

  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================

  /** Determina el tipo de comprobante a emitir según el contribuyente y receptor */
  private determinarTipoComprobante(
    tipoIva: TipoIva,
    docTipoReceptor: number,
  ): number {
    if (tipoIva === TipoIva.MONOTRIBUTISTA) {
      return TIPO_COMPROBANTE.FACTURA_C;
    }
    // Responsable Inscripto
    // doc_tipo 80 = CUIT → puede ser Factura A (RI a RI)
    if (docTipoReceptor === 80) {
      return TIPO_COMPROBANTE.FACTURA_A;
    }
    return TIPO_COMPROBANTE.FACTURA_B;
  }

  /** Construye el objeto de datos de voucher para el SDK de AFIP */
  private buildVoucherData(params: {
    dto: GenerateInvoiceDto;
    creds: AfipCredentials;
    tipoComprobante: number;
    nextVoucherNumber: number;
    fechaStr: string;
  }): Record<string, unknown> {
    const { dto, creds, tipoComprobante, nextVoucherNumber, fechaStr } = params;

    const isMonotributista = creds.tipo_iva === TipoIva.MONOTRIBUTISTA;

    const baseData: Record<string, unknown> = {
      PtoVta: creds.punto_de_venta,
      CbteTipo: tipoComprobante,
      Concepto: dto.concepto,
      DocTipo: dto.doc_tipo_receptor,
      DocNro: dto.doc_nro_receptor,
      CbteDesde: nextVoucherNumber,
      CbteHasta: nextVoucherNumber,
      CbteFch: parseInt(fechaStr, 10),
      ImpTotal: dto.importe_total,
      ImpTotConc: 0,
      ImpOpEx: 0,
      ImpTrib: 0,
      MonId: 'PES',
      MonCotiz: 1,
    };

    if (isMonotributista) {
      // Monotributista: sin IVA discriminado
      baseData.ImpNeto = dto.importe_total;
      baseData.ImpIVA = 0;
      // No se agrega array Iva para Factura C
    } else {
      // Responsable Inscripto: desglosar neto + IVA
      const neto = dto.importe_neto ?? dto.importe_total;
      const iva = dto.importe_iva ?? 0;
      const alicuota = dto.alicuota_iva ?? IVA_ID.IVA_21;

      baseData.ImpNeto = neto;
      baseData.ImpIVA = iva;
      baseData.Iva = [
        {
          Id: alicuota,
          BaseImp: neto,
          Importe: iva,
        },
      ];
    }

    return baseData;
  }

  /** Extrae el CAE de la respuesta de AFIP */
  private extractCae(response: Record<string, unknown>): string | null {
    try {
      // La respuesta completa tiene: FeCAEResponse → FeDetResp → FECAEDetResponse → CAE
      const detResp = (response as any)?.FeCAEResponse?.FeDetResp?.FECAEDetResponse;
      if (Array.isArray(detResp)) {
        return detResp[0]?.CAE?.toString() ?? null;
      }
      return detResp?.CAE?.toString() ?? null;
    } catch {
      return null;
    }
  }

  /** Extrae la fecha de vencimiento del CAE (YYYYMMDD → Date) */
  private extractCaeExpiration(response: Record<string, unknown>): Date {
    try {
      const detResp = (response as any)?.FeCAEResponse?.FeDetResp?.FECAEDetResponse;
      const fchVto = Array.isArray(detResp)
        ? detResp[0]?.CAEFchVto
        : detResp?.CAEFchVto;

      if (fchVto) {
        const s = fchVto.toString();
        return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
      }
    } catch {
      // fallback
    }
    // Vencimiento por defecto: 10 días
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d;
  }
}

