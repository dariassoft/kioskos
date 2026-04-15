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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sale = exports.SaleStatus = exports.PaymentMethod = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/base.entity");
const customer_entity_1 = require("./customer.entity");
const sale_item_entity_1 = require("./sale-item.entity");
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["CARD"] = "card";
    PaymentMethod["TRANSFER"] = "transfer";
    PaymentMethod["CREDIT_CLIENT"] = "credit_client";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var SaleStatus;
(function (SaleStatus) {
    SaleStatus["COMPLETED"] = "completed";
    SaleStatus["REFUNDED"] = "refunded";
    SaleStatus["PENDING"] = "pending";
})(SaleStatus || (exports.SaleStatus = SaleStatus = {}));
let Sale = class Sale extends base_entity_1.BaseKioskosEntity {
};
exports.Sale = Sale;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Sale.prototype, "branch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Sale.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], Sale.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], Sale.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH }),
    __metadata("design:type", String)
], Sale.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED }),
    __metadata("design:type", String)
], Sale.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, (customer) => customer.sales, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], Sale.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sale_item_entity_1.SaleItem, (item) => item.sale, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], Sale.prototype, "items", void 0);
exports.Sale = Sale = __decorate([
    (0, typeorm_1.Entity)('sales')
], Sale);
//# sourceMappingURL=sale.entity.js.map