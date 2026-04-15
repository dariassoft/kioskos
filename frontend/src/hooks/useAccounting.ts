import { useQuery } from '@tanstack/react-query';
import { accountingApi } from '../api/accounting.api';

export const useLedger = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['ledger', startDate, endDate],
    queryFn: () => accountingApi.getLedger(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};
