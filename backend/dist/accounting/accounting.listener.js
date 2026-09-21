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
const purchase_payment_created_event_1 = require("../purchases/events/purchase-payment-created.event");
const purchase_returned_event_1 = require("../purchases/events/purchase-returned.event");
const sale_entity_1 = require("../sales/entities/sale.entity");
const sale_returned_event_1 = require("../sales/events/sale-returned.event");
const expense_voided_event_1 = require("../expenses/events/expense-voided.event");
let AccountingListener = AccountingListener_1 = class AccountingListener {
    constructor(accountingService, saleRepo, tenantRepo) {
        this.accountingService = accountingService;
        this.saleRepo = saleRepo;
        this.tenantRepo = tenantRepo;
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
        const netAmount = Number(event.netAmount ?? event.total);
        const vatAmount = Number(event.vatAmount ?? 0);
        entries.push({ account_name: 'Ventas', debit: 0, credit: netAmount });
        if (vatAmount > 0)
            entries.push({ account_name: 'IVA Débito Fiscal', debit: 0, credit: vatAmount });
        await this.accountingService.createEntry(event.tenantId, `Venta registrada en sucursal ${event.branchId} (${paymentStatus})`, entries, event.saleId);
    }
    async handlePurchaseReceivedEvent(event) {
        this.logger.log(`Registrando asiento contable para Compra ${event.purchaseOrderId}`);
        const entries = [];
        entries.push({ account_name: 'Mercadería', debit: Number(event.netAmount ?? event.total), credit: 0 });
        if (Number(event.vatAmount ?? 0) > 0)
            entries.push({ account_name: 'IVA Crédito Fiscal', debit: Number(event.vatAmount), credit: 0 });
        entries.push({ account_name: 'Proveedores', debit: 0, credit: event.total });
        await this.accountingService.createEntry(event.tenantId, `Compra de mercadería reabastecida en sucursal ${event.branchId}`, entries, event.purchaseOrderId);
    }
    async handleSaleReturnedEvent(event) {
        const sale = await this.saleRepo.findOne({ where: { id: event.saleId, tenant_id: event.tenantId } });
        if (!sale)
            return;
        const debitAccount = this.resolveDebitAccount(sale.payment_method, sale.payment_status);
        const entries = [
            { account_name: 'Ventas', debit: event.netAmount, credit: 0 },
        ];
        if (event.vatAmount > 0)
            entries.push({ account_name: 'IVA Débito Fiscal', debit: event.vatAmount, credit: 0 });
        entries.push({ account_name: debitAccount, debit: 0, credit: event.total });
        await this.accountingService.createEntry(event.tenantId, `Devolución de venta ${event.saleId}`, entries, event.saleReturnId);
    }
    async handlePurchaseReturnedEvent(event) {
        const entries = [
            { account_name: 'Proveedores', debit: event.total, credit: 0 },
            { account_name: 'Mercadería', debit: 0, credit: event.netAmount },
        ];
        if (event.vatAmount > 0)
            entries.push({ account_name: 'IVA Crédito Fiscal', debit: 0, credit: event.vatAmount });
        if (event.refundAmount > 0) {
            const account = event.settlementMethod === 'cash_refund' ? 'Caja' : 'Bancos';
            entries.push({ account_name: account, debit: event.refundAmount, credit: 0 });
            entries.push({ account_name: 'Proveedores', debit: 0, credit: event.refundAmount });
        }
        await this.accountingService.createEntry(event.tenantId, `Devolución a proveedor por orden ${event.purchaseOrderId}`, entries, event.purchaseReturnId);
    }
    async handlePurchasePayment(event) {
        const account = event.paymentMethod === 'cash' ? 'Caja' : 'Bancos';
        await this.accountingService.createEntry(event.tenantId, `Pago a proveedor por orden ${event.purchaseOrderId}`, [
            { account_name: 'Proveedores', debit: event.amount, credit: 0 },
            { account_name: account, debit: 0, credit: event.amount },
        ], event.paymentId);
    }
    async handleExpenseCreatedEvent(event) {
        this.logger.log(`Registrando asiento contable para Gasto ${event.expenseId}`);
        const methodLabels = {
            cash: 'Caja',
            card: 'Tarjetas',
            transfer: 'Bancos',
        };
        const creditAccount = methodLabels[event.paymentMethod] || 'Caja/Banco';
        const entries = [
            { account_name: `Gastos - ${event.categoryName}`, debit: event.amount, credit: 0 },
            { account_name: creditAccount, debit: 0, credit: event.amount },
        ];
        await this.accountingService.createEntry(event.tenantId, `Gasto registrado: ${event.categoryName}${event.branchId ? ` (sucursal ${event.branchId})` : ''}`, entries, event.expenseId);
    }
    async handleExpenseVoidedEvent(event) {
        const methodLabels = { cash: 'Caja', card: 'Tarjetas', transfer: 'Bancos' };
        const creditAccount = methodLabels[event.paymentMethod] || 'Caja/Banco';
        await this.accountingService.createEntry(event.tenantId, `Anulación de gasto: ${event.categoryName} (${event.reason})`, [
            { account_name: creditAccount, debit: event.amount, credit: 0 },
            { account_name: `Gastos - ${event.categoryName}`, debit: 0, credit: event.amount },
        ], event.expenseId);
    }
    async handleStockAdjustedEvent(event) {
        this.logger.log(`Procesando ajuste de stock para Auditoría/Contabilidad: ${event.reason}`);
        const tenant = await this.tenantRepo.findOne({ where: { id: event.tenantId } });
        if (!tenant?.settings?.generate_accounting_on_adjustment) {
            this.logger.log(`Contabilidad automática desactivada para ajustes en tenant ${event.tenantId}`);
            return;
        }
        let expenseAccount = 'Mermas y Pérdidas';
        if (event.reason === 'VENCIMIENTO')
            expenseAccount = 'Pérdida por Vencimiento';
        if (event.reason === 'ROBO')
            expenseAccount = 'Pérdida por Siniestros';
        const entries = [];
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
__decorate([
    (0, event_emitter_1.OnEvent)('sale.returned'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sale_returned_event_1.SaleReturnedEvent]),
    __metadata("design:returntype", Promise)
], AccountingListener.prototype, "handleSaleReturnedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('purchase.returned'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [purchase_returned_event_1.PurchaseReturnedEvent]),
    __metadata("design:returntype", Promise)
], AccountingListener.prototype, "handlePurchaseReturnedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('purchase.payment.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [purchase_payment_created_event_1.PurchasePaymentCreatedEvent]),
    __metadata("design:returntype", Promise)
], AccountingListener.prototype, "handlePurchasePayment", null);
__decorate([
    (0, event_emitter_1.OnEvent)('expense.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountingListener.prototype, "handleExpenseCreatedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('expense.voided'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [expense_voided_event_1.ExpenseVoidedEvent]),
    __metadata("design:returntype", Promise)
], AccountingListener.prototype, "handleExpenseVoidedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('stock.adjusted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountingListener.prototype, "handleStockAdjustedEvent", null);
exports.AccountingListener = AccountingListener = AccountingListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(2, (0, typeorm_1.InjectRepository)(require('../tenants/entities/tenant.entity').Tenant)),
    __metadata("design:paramtypes", [accounting_service_1.AccountingService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AccountingListener);
//# sourceMappingURL=accounting.listener.js.map