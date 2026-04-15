"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const accounting_ledger_entity_1 = require("./entities/accounting-ledger.entity");
const accounting_service_1 = require("./accounting.service");
const accounting_controller_1 = require("./accounting.controller");
const accounting_listener_1 = require("./accounting.listener");
let AccountingModule = class AccountingModule {
};
exports.AccountingModule = AccountingModule;
exports.AccountingModule = AccountingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([accounting_ledger_entity_1.AccountingLedger])],
        controllers: [accounting_controller_1.AccountingController],
        providers: [accounting_service_1.AccountingService, accounting_listener_1.AccountingListener],
    })
], AccountingModule);
//# sourceMappingURL=accounting.module.js.map