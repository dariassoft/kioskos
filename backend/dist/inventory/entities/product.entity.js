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
exports.Product = exports.ProductType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/base.entity");
const unit_entity_1 = require("./unit.entity");
const category_entity_1 = require("./category.entity");
const product_price_entity_1 = require("./product-price.entity");
const inventory_entity_1 = require("./inventory.entity");
const supplier_entity_1 = require("../../purchases/entities/supplier.entity");
const brand_entity_1 = require("./brand.entity");
var ProductType;
(function (ProductType) {
    ProductType["STANDARD"] = "standard";
    ProductType["RAW_MATERIAL"] = "raw_material";
    ProductType["FRACTIONATED"] = "fractionated";
    ProductType["ELABORATED"] = "elaborated";
})(ProductType || (exports.ProductType = ProductType = {}));
let Product = class Product extends base_entity_1.BaseKioskosEntity {
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "barcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "internal_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "unit_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "cost_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "image_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "brand_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "supplier_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 5.0 }),
    __metadata("design:type", Number)
], Product.prototype, "min_stock_alert", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProductType, default: ProductType.STANDARD }),
    __metadata("design:type", String)
], Product.prototype, "product_type", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => unit_entity_1.Unit, { eager: true, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'unit_id' }),
    __metadata("design:type", unit_entity_1.Unit)
], Product.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, { eager: true, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", category_entity_1.Category)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => brand_entity_1.Brand, { eager: true, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'brand_id' }),
    __metadata("design:type", brand_entity_1.Brand)
], Product.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => supplier_entity_1.Supplier, { eager: false, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'supplier_id' }),
    __metadata("design:type", supplier_entity_1.Supplier)
], Product.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_price_entity_1.ProductPrice, (pp) => pp.product, { eager: true }),
    __metadata("design:type", Array)
], Product.prototype, "prices", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_entity_1.Inventory, (inv) => inv.product),
    __metadata("design:type", Array)
], Product.prototype, "inventory_records", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('products')
], Product);
//# sourceMappingURL=product.entity.js.map