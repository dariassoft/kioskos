"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const typeorm_1 = require("@nestjs/typeorm");
const product_entity_1 = require("./entities/product.entity");
const inventory_entity_1 = require("./entities/inventory.entity");
const branch_entity_1 = require("./entities/branch.entity");
const unit_entity_1 = require("./entities/unit.entity");
const category_entity_1 = require("./entities/category.entity");
const price_list_entity_1 = require("./entities/price-list.entity");
const product_price_entity_1 = require("./entities/product-price.entity");
const brand_entity_1 = require("./entities/brand.entity");
const supplier_entity_1 = require("../purchases/entities/supplier.entity");
const inventory_service_1 = require("./inventory.service");
const inventory_controller_1 = require("./inventory.controller");
const inventory_listener_1 = require("./inventory.listener");
const notifications_module_1 = require("../notifications/notifications.module");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                product_entity_1.Product,
                inventory_entity_1.Inventory,
                branch_entity_1.Branch,
                unit_entity_1.Unit,
                category_entity_1.Category,
                price_list_entity_1.PriceList,
                product_price_entity_1.ProductPrice,
                brand_entity_1.Brand,
                supplier_entity_1.Supplier,
            ]),
            notifications_module_1.NotificationsModule,
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.diskStorage)({
                    destination: './uploads',
                    filename: (req, file, cb) => {
                        const uniqueSuffix = (0, uuid_1.v4)();
                        cb(null, `${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
                    },
                }),
            }),
        ],
        controllers: [inventory_controller_1.InventoryController],
        providers: [inventory_service_1.InventoryService, inventory_listener_1.InventoryListener],
        exports: [inventory_service_1.InventoryService],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map