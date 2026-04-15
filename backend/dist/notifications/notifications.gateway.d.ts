import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinTenant(data: {
        tenantId: string;
    }, client: Socket): void;
    sendLowStockAlert(tenantId: string, data: {
        productName: string;
        currentStock: number;
        branchId: string;
        minAlert?: number;
    }): void;
    sendNewSaleNotification(tenantId: string, data: {
        saleId: string;
        total: number;
    }): void;
    sendSubscriptionAlert(tenantId: string, daysRemaining: number): void;
}
