import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { StockReducedEvent } from './events/stock-reduced.event';
import { NotificationsGateway } from '../notifications/notifications.gateway';

/**
 * InventoryListener — Escucha el evento 'stock.reduced'.
 * Verifica si el stock cayó por debajo del mínimo y envía alerta WebSocket.
 *
 * Es ASINCRÓNICO: no bloquea la transacción de venta.
 * En el futuro (Fase 5): también dispara email si el plan es Profesional.
 */
@Injectable()
export class InventoryListener {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @OnEvent('stock.reduced', { async: true })
  async handleStockReducedEvent(event: StockReducedEvent): Promise<void> {
    try {
      const item = await this.inventoryRepo.findOne({
        where: {
          product_id: event.productId,
          branch_id: event.branchId,
          tenant_id: event.tenantId,
        },
      });

      if (!item) return;

      // Verificar si cayó por debajo del umbral mínimo
      if (Number(item.stock_quantity) <= Number(item.min_stock_alert)) {
        this.notificationsGateway.sendLowStockAlert(event.tenantId, {
          productName: event.productName,
          currentStock: Number(item.stock_quantity),
          branchId: event.branchId,
          minAlert: Number(item.min_stock_alert),
        });

        console.log(
          `[StockAlert] Producto "${event.productName}" — Stock: ${item.stock_quantity} (mín: ${item.min_stock_alert})`,
        );
      }
    } catch (error) {
      console.error('[InventoryListener] Error al procesar alerta de stock:', error);
    }
  }
}
