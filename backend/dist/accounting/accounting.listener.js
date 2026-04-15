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
var AccountingListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const accounting_service_1 = require("./accounting.service");
const sale_completed_event_1 = require("../sales/events/sale-completed.event");
const purchase_received_event_1 = require("../purchases/events/purchase-received.event");
let AccountingListener = AccountingListener_1 = class AccountingListener {
    constructor(accountingService) {
        this.accountingService = accountingService;
        this.logger = new common_1.Logger(AccountingListener_1.name);
    }
    async handleSaleCompletedEvent(event) {
        this.logger.log(`Registrando asiento contable para Venta ${event.saleId}`);
        const entries = [];
        const debitAccount = event.paymentMethod === 'credit_client' ? 'Deudores por Ventas' : 'Caja/Banco';
        entries.push({ account_name: debitAccount, debit: event.total, credit: 0 });
        entries.push({ account_name: 'Ventas', debit: 0, credit: event.total });
        await this.accountingService.createEntry(event.tenantId, `Venta registrada en sucursal ${event.branchId}`, entries, event.saleId);
    }
    async handlePurchaseReceivedEvent(event) {
        this.logger.log(`Registrando asiento contable para Compra ${event.purchaseOrderId}`);
        const entries = [];
        entries.push({ account_name: 'Mercadería', debit: event.total, credit: 0 });
        entries.push({ account_name: 'Caja/Banco', debit: 0, credit: event.total });
        await this.accountingService.createEntry(event.tenantId, `Compra de mercadería reabastecida en sucursal ${event.branchId}`, entries, event.purchaseOrderId);
    }
};
exports.AccountingListener = AccountingListener;
__decorate([
    (0, event_emitter_1.OnEvent)('sale.completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sale_completed_event_1.SaleCompletedEvent]),
    __metadata("design:returntype", Promise)
], AccountingListener.prototype, "handleSaleCompletedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('purchase.received'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [purchase_received_event_1.PurchaseReceivedEvent]),
    __metadata("design:returntype", Promise)
], AccountingListener.prototype, "handlePurchaseReceivedEvent", null);
exports.AccountingListener = AccountingListener = AccountingListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [accounting_service_1.AccountingService])
], AccountingListener);
//# sourceMappingURL=accounting.listener.js.map