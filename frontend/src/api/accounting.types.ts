export interface AccountingLedger {
  id: string;
  reference_id: string | null;
  date: string;
  description: string;
  account_name: string;
  debit: number;
  credit: number;
}
