import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AccountingService } from './accounting.service';
import { SaleCompletedEvent } from '../sales/events/sale-completed.event';
import { PurchaseReceivedEvent } from '../purchases/events/purchase-received.event';

@Injectable()
export class AccountingListener {
  private readonly logger = new Logger(AccountingListener.name);

  constructor(private readonly accountingService: AccountingService) {}

  @OnEvent('sale.completed')
  async handleSaleCompletedEvent(event: SaleCompletedEvent) {
    this.logger.log(`Registrando asiento contable para Venta ${event.saleId}`);

    const entries = [];
    const debitAccount = event.paymentMethod === 'credit_client' ? 'Deudores por Ventas' : 'Caja/Banco';

    // Debe (Ingreso de dinero o derecho de cobro)
    entries.push({ account_name: debitAccount, debit: event.total, credit: 0 });
    // Haber (Ventas - Ganancia)
    entries.push({ account_name: 'Ventas', debit: 0, credit: event.total });

    await this.accountingService.createEntry(
      event.tenantId,
      `Venta registrada en sucursal ${event.branchId}`,
      entries,
      event.saleId,
    );
  }

  @OnEvent('purchase.received')
  async handlePurchaseReceivedEvent(event: PurchaseReceivedEvent) {
    this.logger.log(`Registrando asiento contable para Compra ${event.purchaseOrderId}`);

    const entries = [];

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
}
