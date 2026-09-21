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
exports.CreatePurchasePaymentDto = exports.CreatePurchaseReturnDto = exports.CreatePurchaseReturnItemDto = exports.PurchaseReturnSettlementDto = exports.ReceivePurchaseOrderDto = exports.UpdatePurchaseOrderDto = exports.CreatePurchaseOrderDto = exports.CreatePurchaseOrderItemDto = exports.UpdateSupplierDto = exports.CreateSupplierDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateSupplierDto {
}
exports.CreateSupplierDto = CreateSupplierDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "contact_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "tax_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Habilita una cuenta corriente con este proveedor' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], CreateSupplierDto.prototype, "current_account_enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, description: 'Saldo inicial de la cuenta corriente' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateSupplierDto.prototype, "opening_balance", void 0);
class UpdateSupplierDto extends CreateSupplierDto {
}
exports.UpdateSupplierDto = UpdateSupplierDto;
class CreatePurchaseOrderItemDto {
}
exports.CreatePurchaseOrderItemDto = CreatePurchaseOrderItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)('all'),
    __metadata("design:type", String)
], CreatePurchaseOrderItemDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePurchaseOrderItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePurchaseOrderItemDto.prototype, "unit_cost", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 21, description: 'IVA de la línea. Si se omite se usa el IVA del producto.' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePurchaseOrderItemDto.prototype, "vat_rate", void 0);
class CreatePurchaseOrderDto {
}
exports.CreatePurchaseOrderDto = CreatePurchaseOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)('all'),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "supplier_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: 'branch_id debe tener formato UUID' }),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CreatePurchaseOrderItemDto] }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreatePurchaseOrderItemDto),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreatePurchaseOrderDto.prototype, "items", void 0);
class UpdatePurchaseOrderDto extends CreatePurchaseOrderDto {
}
exports.UpdatePurchaseOrderDto = UpdatePurchaseOrderDto;
class ReceivePurchaseOrderDto {
}
exports.ReceivePurchaseOrderDto = ReceivePurchaseOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CreatePurchaseOrderItemDto], description: 'Mercadería realmente entregada por el proveedor' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreatePurchaseOrderItemDto),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], ReceivePurchaseOrderDto.prototype, "items", void 0);
var PurchaseReturnSettlementDto;
(function (PurchaseReturnSettlementDto) {
    PurchaseReturnSettlementDto["CREDIT_NOTE"] = "credit_note";
    PurchaseReturnSettlementDto["CASH_REFUND"] = "cash_refund";
    PurchaseReturnSettlementDto["BANK_REFUND"] = "bank_refund";
})(PurchaseReturnSettlementDto || (exports.PurchaseReturnSettlementDto = PurchaseReturnSettlementDto = {}));
class CreatePurchaseReturnItemDto {
}
exports.CreatePurchaseReturnItemDto = CreatePurchaseReturnItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)('all'),
    __metadata("design:type", String)
], CreatePurchaseReturnItemDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePurchaseReturnItemDto.prototype, "quantity", void 0);
class CreatePurchaseReturnDto {
}
exports.CreatePurchaseReturnDto = CreatePurchaseReturnDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CreatePurchaseReturnItemDto] }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreatePurchaseReturnItemDto),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreatePurchaseReturnDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mercadería dañada' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePurchaseReturnDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PurchaseReturnSettlementDto }),
    (0, class_validator_1.IsEnum)(PurchaseReturnSettlementDto),
    __metadata("design:type", String)
], CreatePurchaseReturnDto.prototype, "settlement_method", void 0);
class CreatePurchasePaymentDto {
}
exports.CreatePurchasePaymentDto = CreatePurchasePaymentDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePurchasePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['cash', 'transfer', 'bank']),
    __metadata("design:type", String)
], CreatePurchasePaymentDto.prototype, "payment_method", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePurchasePaymentDto.prototype, "notes", void 0);
//# sourceMappingURL=purchases.dto.js.map