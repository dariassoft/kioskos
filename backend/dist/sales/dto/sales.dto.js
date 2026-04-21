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
exports.ListSalesQueryDto = exports.CreateSaleDto = exports.PaymentDetailsDto = exports.CreateSaleItemDto = exports.CloseCashRegisterDto = exports.OpenCashRegisterDto = exports.UpdateCustomerDto = exports.CreateCustomerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const sale_entity_1 = require("../entities/sale.entity");
const LEGACY_UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
class CreateCustomerDto {
}
exports.CreateCustomerDto = CreateCustomerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Juan Pérez' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10000.0, description: 'Límite de fiado autorizado' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCustomerDto.prototype, "credit_limit", void 0);
class UpdateCustomerDto extends CreateCustomerDto {
}
exports.UpdateCustomerDto = UpdateCustomerDto;
class OpenCashRegisterDto {
}
exports.OpenCashRegisterDto = OpenCashRegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID de la sucursal' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OpenCashRegisterDto.prototype, "branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5000.0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], OpenCashRegisterDto.prototype, "opening_balance", void 0);
class CloseCashRegisterDto {
}
exports.CloseCashRegisterDto = CloseCashRegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15000.0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CloseCashRegisterDto.prototype, "closing_balance", void 0);
class CreateSaleItemDto {
}
exports.CreateSaleItemDto = CreateSaleItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)('all'),
    __metadata("design:type", String)
], CreateSaleItemDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2.5 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateSaleItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150.0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateSaleItemDto.prototype, "unit_price", void 0);
class PaymentDetailsDto {
}
exports.PaymentDetailsDto = PaymentDetailsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID de pago de MercadoPago' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDetailsDto.prototype, "mp_payment_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Estado del pago de MercadoPago' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDetailsDto.prototype, "mp_payment_status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nombre del pagador' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDetailsDto.prototype, "payer_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email del pagador' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDetailsDto.prototype, "payer_email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Comprobante de transferencia' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDetailsDto.prototype, "transfer_voucher", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Banco / billetera de origen' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDetailsDto.prototype, "transfer_origin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Últimos 4 dígitos de tarjeta' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDetailsDto.prototype, "card_last_digits", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Marca de tarjeta' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDetailsDto.prototype, "card_brand", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Código de autorización' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDetailsDto.prototype, "authorization_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notas adicionales del pago' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentDetailsDto.prototype, "payment_notes", void 0);
class CreateSaleDto {
}
exports.CreateSaleDto = CreateSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID de la sucursal' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "branch_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsUUID)('all'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: sale_entity_1.PaymentMethod }),
    (0, class_validator_1.IsEnum)(sale_entity_1.PaymentMethod),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "payment_method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sale_entity_1.PaymentStatus, description: 'Estado de cobro del pago' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sale_entity_1.PaymentStatus),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "payment_status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CreateSaleItemDto] }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateSaleItemDto),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateSaleDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: PaymentDetailsDto, description: 'Detalles del pago (opcional)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PaymentDetailsDto),
    __metadata("design:type", PaymentDetailsDto)
], CreateSaleDto.prototype, "payment_details", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Solicitar factura electrónica ARCA' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Boolean)
], CreateSaleDto.prototype, "request_invoice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tipo de documento para la factura (DNI=96, CUIT=80)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateSaleDto.prototype, "invoice_doc_tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Número de documento para la factura' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "invoice_doc_nro", void 0);
class ListSalesQueryDto {
}
exports.ListSalesQueryDto = ListSalesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListSalesQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListSalesQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sale_entity_1.PaymentStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sale_entity_1.PaymentStatus),
    __metadata("design:type", String)
], ListSalesQueryDto.prototype, "payment_status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-04-01', description: 'Fecha desde (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListSalesQueryDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-04-30', description: 'Fecha hasta (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListSalesQueryDto.prototype, "end_date", void 0);
//# sourceMappingURL=sales.dto.js.map