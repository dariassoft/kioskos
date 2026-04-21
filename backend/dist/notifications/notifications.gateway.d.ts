import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly publicApi;
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
    sendPendingPaymentAlert(data: {
        pendingId: string;
        businessName: string;
        ownerEmail: string;
        paymentMethod: string;
        amount: number;
    }): void;
    sendPendingPaymentResolved(data: {
        pendingId: string;
        businessName: string;
        paymentMethod: string;
    }): void;
    sendReferralSuccessAlert(referrerTenantId: string, data: {
        newBusinessName: string;
        discountPercentage: number;
    }): void;
    sendGeneralNotification(tenantId: string, data: {
        title: string;
        message: string;
        variant?: 'info' | 'success' | 'warning' | 'error';
    }): void;
}
