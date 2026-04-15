import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AccountingLedger } from './entities/accounting-ledger.entity';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(AccountingLedger)
    private readonly ledgerRepo: Repository<AccountingLedger>,
  ) {}

  async createEntry(
    tenantId: string,
    description: string,
    entries: { account_name: string; debit?: number; credit?: number }[],
    referenceId?: string,
  ): Promise<AccountingLedger[]> {
    const records = entries.map((e) =>
      this.ledgerRepo.create({
        tenant_id: tenantId,
        reference_id: referenceId,
        description,
        account_name: e.account_name,
        debit: e.debit || 0,
        credit: e.credit || 0,
      }),
    );
    return this.ledgerRepo.save(records);
  }

  async getLedgerByDates(
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<AccountingLedger[]> {
    // startDate and endDate should be YYYY-MM-DD format
    return this.ledgerRepo
      .createQueryBuilder('ledger')
      .where('ledger.tenant_id = :tenantId', { tenantId })
      .andWhere('DATE(ledger.date) >= :startDate', { startDate })
      .andWhere('DATE(ledger.date) <= :endDate', { endDate })
      .orderBy('ledger.date', 'DESC')
      .getMany();
  }
}
