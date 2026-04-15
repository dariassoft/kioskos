import { Repository } from 'typeorm';
import { AccountingLedger } from './entities/accounting-ledger.entity';
export declare class AccountingService {
    private readonly ledgerRepo;
    constructor(ledgerRepo: Repository<AccountingLedger>);
    createEntry(tenantId: string, description: string, entries: {
        account_name: string;
        debit?: number;
        credit?: number;
    }[], referenceId?: string): Promise<AccountingLedger[]>;
    getLedgerByDates(tenantId: string, startDate: string, endDate: string): Promise<AccountingLedger[]>;
}
