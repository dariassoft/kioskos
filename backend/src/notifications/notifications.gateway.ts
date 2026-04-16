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

  private readonly publicApi = {
    sendLowStockAlert: this.sendLowStockAlert.bind(this),
    sendPendingPaymentAlert: this.sendPendingPaymentAlert.bind(this),
    sendPendingPaymentResolved: this.sendPendingPaymentResolved.bind(this),
  };

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
    this.publicApi;
    this.server.to(`tenant_${tenantId}`).emit('low_stock_alert', {
      type: 'low_stock',
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Alerta global para SuperAdmin cuando aparece un pago pendiente.
   */
  sendPendingPaymentAlert(data: {
    pendingId: string;
    businessName: string;
    ownerEmail: string;
    paymentMethod: string;
    amount: number;
  }) {
    this.publicApi;
    this.server.emit('pending_payment_alert', {
      type: 'pending_payment_alert',
      ...data,
      timestamp: new Date().toISOString(),
    } as never);
  }

  /**
   * Alerta global para SuperAdmin cuando un pago pendiente fue resuelto.
   */
  sendPendingPaymentResolved(data: {
    pendingId: string;
    businessName: string;
    paymentMethod: string;
  }) {
    this.publicApi;
    this.server.emit('pending_payment_resolved', {
      type: 'pending_payment_resolved',
      ...data,
      timestamp: new Date().toISOString(),
    } as never);
  }
}
