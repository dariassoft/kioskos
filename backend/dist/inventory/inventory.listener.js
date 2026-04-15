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
exports.InventoryListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_entity_1 = require("./entities/inventory.entity");
const stock_reduced_event_1 = require("./events/stock-reduced.event");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
let InventoryListener = class InventoryListener {
    constructor(inventoryRepo, notificationsGateway) {
        this.inventoryRepo = inventoryRepo;
        this.notificationsGateway = notificationsGateway;
    }
    async handleStockReducedEvent(event) {
        try {
            const item = await this.inventoryRepo.findOne({
                where: {
                    product_id: event.productId,
                    branch_id: event.branchId,
                    tenant_id: event.tenantId,
                },
            });
            if (!item)
                return;
            if (Number(item.stock_quantity) <= Number(item.min_stock_alert)) {
                this.notificationsGateway.sendLowStockAlert(event.tenantId, {
                    productName: event.productName,
                    currentStock: Number(item.stock_quantity),
                    branchId: event.branchId,
                    minAlert: Number(item.min_stock_alert),
                });
                console.log(`[StockAlert] Producto "${event.productName}" — Stock: ${item.stock_quantity} (mín: ${item.min_stock_alert})`);
            }
        }
        catch (error) {
            console.error('[InventoryListener] Error al procesar alerta de stock:', error);
        }
    }
};
exports.InventoryListener = InventoryListener;
__decorate([
    (0, event_emitter_1.OnEvent)('stock.reduced', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_reduced_event_1.StockReducedEvent]),
    __metadata("design:returntype", Promise)
], InventoryListener.prototype, "handleStockReducedEvent", null);
exports.InventoryListener = InventoryListener = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_gateway_1.NotificationsGateway])
], InventoryListener);
//# sourceMappingURL=inventory.listener.js.map