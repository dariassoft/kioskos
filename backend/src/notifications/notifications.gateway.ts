import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * NotificationsGateway — WebSocket Gateway
 *
 * Gestiona la comunicación en tiempo real con los clientes.
 * Cada tenant se une a su propio "room" para aislamiento de notificaciones.
 *
 * Eventos emitidos al cliente:
 *  - 'low_stock_alert'    → Alerta de stock bajo
 *  - 'new_sale'           → Nueva venta registrada
 *  - 'subscription_alert' → Suscripción por vencer
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[WS] Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Cliente desconectado: ${client.id}`);
  }

  /**
   * El cliente envía su tenantId para unirse al room correspondiente.
   * El frontend llama: socket.emit('join_tenant', { tenantId: '...' })
   */
  @SubscribeMessage('join_tenant')
  handleJoinTenant(
    @MessageBody() data: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.tenantId) {
      client.join(`tenant_${data.tenantId}`);
      console.log(`[WS] Cliente ${client.id} se unió al room tenant_${data.tenantId}`);
    }
  }

  // ==========================================
  // MÉTODOS PARA EMITIR EVENTOS
  // ==========================================

  /**
   * Alerta de stock bajo — emite solo al tenant afectado
   */
  sendLowStockAlert(
    tenantId: string,
    data: { productName: string; currentStock: number; branchId: string; minAlert?: number },
  ) {
    this.server.to(`tenant_${tenantId}`).emit('low_stock_alert', {
      type: 'low_stock',
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notificación de nueva venta
   */
  sendNewSaleNotification(tenantId: string, data: { saleId: string; total: number }) {
    this.server.to(`tenant_${tenantId}`).emit('new_sale', {
      type: 'new_sale',
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Alerta de suscripción por vencer
   */
  sendSubscriptionAlert(tenantId: string, daysRemaining: number) {
    this.server.to(`tenant_${tenantId}`).emit('subscription_alert', {
      type: 'subscription_expiring',
      daysRemaining,
      timestamp: new Date().toISOString(),
    });
  }
}
