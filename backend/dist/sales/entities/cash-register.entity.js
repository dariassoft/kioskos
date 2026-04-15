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
exports.CashRegister = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/base.entity");
let CashRegister = class CashRegister extends base_entity_1.BaseKioskosEntity {
};
exports.CashRegister = CashRegister;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], CashRegister.prototype, "branch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], CashRegister.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], CashRegister.prototype, "opening_balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CashRegister.prototype, "closing_balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0.0 }),
    __metadata("design:type", Number)
], CashRegister.prototype, "cash_sales", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['open', 'closed'], default: 'open' }),
    __metadata("design:type", String)
], CashRegister.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], CashRegister.prototype, "opened_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CashRegister.prototype, "closed_at", void 0);
exports.CashRegister = CashRegister = __decorate([
    (0, typeorm_1.Entity)('cash_registers')
], CashRegister);
//# sourceMappingURL=cash-register.entity.js.map