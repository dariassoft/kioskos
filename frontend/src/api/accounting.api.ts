import apiClient from './client';
import type { AccountingLedger } from './accounting.types';

export const accountingApi = {
  getLedger: (startDate: string, endDate: string) => 
    apiClient.get<AccountingLedger[]>('/accounting/ledger', {
      params: { startDate, endDate }
    }).then((res) => res.data),
};
