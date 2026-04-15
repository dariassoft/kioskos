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
exports.ProductPrice = void 0;
const typeorm_1 = require("typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./product.entity");
const price_list_entity_1 = require("./price-list.entity");
let ProductPrice = class ProductPrice {
};
exports.ProductPrice = ProductPrice;
__decorate([
    (0, typeorm_2.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductPrice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ProductPrice.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ProductPrice.prototype, "price_list_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0.0 }),
    __metadata("design:type", Number)
], ProductPrice.prototype, "price", void 0);
__decorate([
    (0, typeorm_2.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductPrice.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_2.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductPrice.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, (product) => product.prices, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], ProductPrice.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => price_list_entity_1.PriceList, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'price_list_id' }),
    __metadata("design:type", price_list_entity_1.PriceList)
], ProductPrice.prototype, "price_list", void 0);
exports.ProductPrice = ProductPrice = __decorate([
    (0, typeorm_1.Entity)('product_prices')
], ProductPrice);
//# sourceMappingURL=product-price.entity.js.map