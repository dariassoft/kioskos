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
var AccountingListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const accounting_service_1 = require("./accounting.service");
const sale_completed_event_1 = require("../sales/events/sale-completed.event");
const purchase_received_event_1 = require("../purchases/events/purchase-received.event");
const sale_entity_1 = require("../sales/entities/sale.entity");
let AccountingListener = AccountingListener_1 = class AccountingListener {
    constructor(accountingService, saleRepo) {
        this.accountingService = accountingService;
        this.saleRepo = saleRepo;
        this.logger = new common_1.Logger(AccountingListener_1.name);
    }
    async handleSaleCompletedEvent(event) {
        this.logger.log(`Registrando asiento contable para Venta ${event.saleId}`);
        const sale = await this.saleRepo.findOne({ where: { id: event.saleId, tenant_id: event.tenantId } });
        const paymentMethod = (sale?.payment_method ?? event.paymentMethod);
        const paymentStatus = sale?.payment_status ?? sale_entity_1.PaymentStatus.CONFIRMED;
        const entries = [];
        const debitAccount = this.resolveDebitAccount(paymentMethod, paymentStatus);
        entries.push({ account_name: debitAccount, debit: event.total, credit: 0 });
        entries.push({ account_name: 'Ventas', debit: 0, credit: event.total });
        await this.accountingService.createEntry(event.tenantId, `Venta registrada en sucursal ${event.branchId} (${paymentStatus})`, entries, event.saleId);
    }
    async handlePurchaseReceivedEvent(event) {
        this.logger.log(`Registrando asiento contable para Compra ${event.purchaseOrderId}`);
        const entries = [];
        entries.push({ account_name: 'Mercadería', debit: event.total, credit: 0 });
        entries.push({ account_name: 'Caja/Banco', debit: 0, credit: event.total });
        await this.accountingService.createEntry(event.tenantId, `Compra de mercadería reabastecida en sucursal ${event.branchId}`, entries, event.purchaseOrderId);
    }
    resolveDebitAccount(paymentMethod, paymentStatus) {
        if (paymentStatus === sale_entity_1.PaymentStatus.PENDING) {
            if (paymentMethod === sale_entity_1.PaymentMethod.TRANSFER)
                return 'Transferencias a Acreditar';
            if (paymentMethod === sale_entity_1.PaymentMethod.QR_MERCADOPAGO || paymentMethod === sale_entity_1.PaymentMethod.LINK_MERCADOPAGO) {
                return 'MercadoPago a Acreditar';
            }
            return 'Cuentas por Cobrar';
        }
        switch (paymentMethod) {
            case sale_entity_1.PaymentMethod.CASH:
                return 'Caja';
            case sale_entity_1.PaymentMethod.DEBIT_CARD:
                return 'Tarjetas de Débito a Cobrar';
            case sale_entity_1.PaymentMethod.CREDIT_CARD:
                return 'Tarjetas de Crédito a Cobrar';
            case sale_entity_1.PaymentMethod.TRANSFER:
                return 'Bancos';
            case sale_entity_1.PaymentMethod.QR_MERCADOPAGO:
            case sale_entity_1.PaymentMethod.LINK_MERCADOPAGO:
                return 'MercadoPago';
            case sale_entity_1.PaymentMethod.CREDIT_CLIENT:
                return 'Cuentas por Cobrar';
            default:
                return 'Caja/Banco';
        }
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
    __param(1, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __metadata("design:paramtypes", [accounting_service_1.AccountingService,
        typeorm_2.Repository])
], AccountingListener);
//# sourceMappingURL=accounting.listener.js.map