"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const sale_entity_1 = require("./entities/sale.entity");
const sale_item_entity_1 = require("./entities/sale-item.entity");
const cash_register_entity_1 = require("./entities/cash-register.entity");
const customer_entity_1 = require("./entities/customer.entity");
const payment_account_entity_1 = require("./entities/payment-account.entity");
const branch_entity_1 = require("../inventory/entities/branch.entity");
const sales_service_1 = require("./sales.service");
const sales_controller_1 = require("./sales.controller");
const inventory_module_1 = require("../inventory/inventory.module");
const electronic_invoicing_module_1 = require("../electronic-invoicing/electronic-invoicing.module");
let SalesModule = class SalesModule {
};
exports.SalesModule = SalesModule;
exports.SalesModule = SalesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([sale_entity_1.Sale, sale_item_entity_1.SaleItem, cash_register_entity_1.CashRegister, customer_entity_1.Customer, branch_entity_1.Branch, payment_account_entity_1.PaymentAccount]),
            inventory_module_1.InventoryModule,
            electronic_invoicing_module_1.ElectronicInvoicingModule,
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.diskStorage)({
                    destination: './uploads',
                    filename: (req, file, cb) => {
                        const uniqueSuffix = (0, uuid_1.v4)();
                        cb(null, `voucher-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
                    },
                }),
            }),
        ],
        controllers: [sales_controller_1.SalesController],
        providers: [sales_service_1.SalesService],
        exports: [sales_service_1.SalesService],
    })
], SalesModule);
//# sourceMappingURL=sales.module.js.map