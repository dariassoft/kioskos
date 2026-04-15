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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const accounting_ledger_entity_1 = require("./entities/accounting-ledger.entity");
let AccountingService = class AccountingService {
    constructor(ledgerRepo) {
        this.ledgerRepo = ledgerRepo;
    }
    async createEntry(tenantId, description, entries, referenceId) {
        const records = entries.map((e) => this.ledgerRepo.create({
            tenant_id: tenantId,
            reference_id: referenceId,
            description,
            account_name: e.account_name,
            debit: e.debit || 0,
            credit: e.credit || 0,
        }));
        return this.ledgerRepo.save(records);
    }
    async getLedgerByDates(tenantId, startDate, endDate) {
        return this.ledgerRepo
            .createQueryBuilder('ledger')
            .where('ledger.tenant_id = :tenantId', { tenantId })
            .andWhere('DATE(ledger.date) >= :startDate', { startDate })
            .andWhere('DATE(ledger.date) <= :endDate', { endDate })
            .orderBy('ledger.date', 'DESC')
            .getMany();
    }
};
exports.AccountingService = AccountingService;
exports.AccountingService = AccountingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(accounting_ledger_entity_1.AccountingLedger)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AccountingService);
//# sourceMappingURL=accounting.service.js.map