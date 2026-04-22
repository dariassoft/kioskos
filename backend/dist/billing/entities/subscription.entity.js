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
exports.Subscription = exports.SubscriptionStatus = void 0;
const typeorm_1 = require("typeorm");
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["CANCELLED"] = "cancelled";
    SubscriptionStatus["SUSPENDED"] = "suspended";
    SubscriptionStatus["PAST_DUE"] = "past_due";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
let Subscription = class Subscription {
};
exports.Subscription = Subscription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Subscription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Subscription.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Subscription.prototype, "plan_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Subscription.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Subscription.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Subscription.prototype, "auto_renew", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Subscription.prototype, "last_payment_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Subscription.prototype, "next_billing_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Subscription.prototype, "discount_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_ends_at', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "discount_ends_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "locked_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "locked_plan_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 10 }),
    __metadata("design:type", Number)
], Subscription.prototype, "billing_day", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE }),
    __metadata("design:type", String)
], Subscription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "cancelled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "cancellation_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "promotion_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "price_after_promo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "promo_ends_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "mp_preapproval_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Subscription.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Subscription.prototype, "updated_at", void 0);
exports.Subscription = Subscription = __decorate([
    (0, typeorm_1.Entity)('subscriptions')
], Subscription);
//# sourceMappingURL=subscription.entity.js.map