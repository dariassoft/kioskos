import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingService } from '@accounting/accounting.service';
import { SaleCompletedEvent } from '@sales/events/sale-completed.event';
import { PurchaseReceivedEvent } from '@purchases/events/purchase-received.event';
import { PaymentMethod, PaymentStatus, Sale } from '@sales/entities/sale.entity';

@Injectable()
export class AccountingListener {
  private readonly logger = new Logger(AccountingListener.name);

  constructor(
    private readonly accountingService: AccountingService,
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
  ) {}

  @OnEvent('sale.completed')
  async handleSaleCompletedEvent(event: SaleCompletedEvent) {
    this.logger.log(`Registrando asiento contable para Venta ${event.saleId}`);

    const sale = await this.saleRepo.findOne({ where: { id: event.saleId, tenant_id: event.tenantId } });
    const paymentMethod = (sale?.payment_method ?? event.paymentMethod) as PaymentMethod;
    const paymentStatus = sale?.payment_status ?? PaymentStatus.CONFIRMED;

    const entries: { account_name: string; debit?: number; credit?: number }[] = [];
    const debitAccount = this.resolveDebitAccount(paymentMethod, paymentStatus);

    // Debe (Ingreso de dinero o derecho de cobro)
    entries.push({ account_name: debitAccount, debit: event.total, credit: 0 });
    // Haber (Ventas)
    entries.push({ account_name: 'Ventas', debit: 0, credit: event.total });

    await this.accountingService.createEntry(
      event.tenantId,
      `Venta registrada en sucursal ${event.branchId} (${paymentStatus})`,
      entries,
      event.saleId,
    );
  }

  @OnEvent('purchase.received')
  async handlePurchaseReceivedEvent(event: PurchaseReceivedEvent) {
    this.logger.log(`Registrando asiento contable para Compra ${event.purchaseOrderId}`);

    const entries: { account_name: string; debit?: number; credit?: number }[] = [];

    // Debe (Aumento de activo: Mercadería)
    entries.push({ account_name: 'Mercadería', debit: event.total, credit: 0 });
    // Haber (Reducción de activo/Aumento de pasivo) - Asumimos pago en caja para mantenerlo simple.
    entries.push({ account_name: 'Caja/Banco', debit: 0, credit: event.total });

    await this.accountingService.createEntry(
      event.tenantId,
      `Compra de mercadería reabastecida en sucursal ${event.branchId}`,
      entries,
      event.purchaseOrderId,
    );
  }

  private resolveDebitAccount(paymentMethod: PaymentMethod, paymentStatus: PaymentStatus): string {
    if (paymentStatus === PaymentStatus.PENDING) {
      if (paymentMethod === PaymentMethod.TRANSFER) return 'Transferencias a Acreditar';
      if (paymentMethod === PaymentMethod.QR_MERCADOPAGO || paymentMethod === PaymentMethod.LINK_MERCADOPAGO) {
        return 'MercadoPago a Acreditar';
      }
      return 'Cuentas por Cobrar';
    }

    switch (paymentMethod) {
      case PaymentMethod.CASH:
        return 'Caja';
      case PaymentMethod.DEBIT_CARD:
        return 'Tarjetas de Débito a Cobrar';
      case PaymentMethod.CREDIT_CARD:
        return 'Tarjetas de Crédito a Cobrar';
      case PaymentMethod.TRANSFER:
        return 'Bancos';
      case PaymentMethod.QR_MERCADOPAGO:
      case PaymentMethod.LINK_MERCADOPAGO:
        return 'MercadoPago';
      case PaymentMethod.CREDIT_CLIENT:
        return 'Cuentas por Cobrar';
      default:
        return 'Caja/Banco';
    }
  }
}
