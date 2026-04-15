import { AccountingService } from './accounting.service';
export declare class AccountingController {
    private readonly accountingService;
    constructor(accountingService: AccountingService);
    getLedger(tenantId: string, startDate: string, endDate: string): Promise<import("./entities/accounting-ledger.entity").AccountingLedger[]>;
}
