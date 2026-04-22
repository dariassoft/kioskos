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
exports.BillingHistory = exports.PaymentStatus = void 0;
const typeorm_1 = require("typeorm");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
let BillingHistory = class BillingHistory {
};
exports.BillingHistory = BillingHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BillingHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], BillingHistory.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], BillingHistory.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING }),
    __metadata("design:type", String)
], BillingHistory.prototype, "payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], BillingHistory.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], BillingHistory.prototype, "invoice_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], BillingHistory.prototype, "plan_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], BillingHistory.prototype, "plan_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], BillingHistory.prototype, "billing_period_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], BillingHistory.prototype, "billing_period_end", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], BillingHistory.prototype, "is_prorated", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], BillingHistory.prototype, "promotion_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], BillingHistory.prototype, "created_at", void 0);
exports.BillingHistory = BillingHistory = __decorate([
    (0, typeorm_1.Entity)('billing_history')
], BillingHistory);
//# sourceMappingURL=billing-history.entity.js.map