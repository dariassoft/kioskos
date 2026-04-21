"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let NotificationsGateway = class NotificationsGateway {
    constructor() {
        this.publicApi = {
            sendLowStockAlert: this.sendLowStockAlert.bind(this),
            sendPendingPaymentAlert: this.sendPendingPaymentAlert.bind(this),
            sendPendingPaymentResolved: this.sendPendingPaymentResolved.bind(this),
        };
    }
    handleConnection(client) {
        console.log(`[WS] Cliente conectado: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`[WS] Cliente desconectado: ${client.id}`);
    }
    handleJoinTenant(data, client) {
        if (data?.tenantId) {
            client.join(`tenant_${data.tenantId}`);
            console.log(`[WS] Cliente ${client.id} se unió al room tenant_${data.tenantId}`);
        }
    }
    sendLowStockAlert(tenantId, data) {
        this.publicApi;
        this.server.to(`tenant_${tenantId}`).emit('low_stock_alert', {
            type: 'low_stock',
            ...data,
            timestamp: new Date().toISOString(),
        });
    }
    sendPendingPaymentAlert(data) {
        this.publicApi;
        this.server.emit('pending_payment_alert', {
            type: 'pending_payment_alert',
            ...data,
            timestamp: new Date().toISOString(),
        });
    }
    sendPendingPaymentResolved(data) {
        this.publicApi;
        this.server.emit('pending_payment_resolved', {
            type: 'pending_payment_resolved',
            ...data,
            timestamp: new Date().toISOString(),
        });
    }
    sendReferralSuccessAlert(referrerTenantId, data) {
        this.server.to(`tenant_${referrerTenantId}`).emit('referral_success_alert', {
            type: 'referral_success',
            ...data,
            message: `¡Buenas noticias! ${data.newBusinessName} se unió gracias a vos. Se te aplicó un ${data.discountPercentage}% de descuento.`,
            timestamp: new Date().toISOString(),
        });
    }
    sendGeneralNotification(tenantId, data) {
        this.server.to(`tenant_${tenantId}`).emit('general_notification', {
            ...data,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_tenant'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleJoinTenant", null);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        },
        namespace: '/',
    })
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map