export type CurrentAccountType = 'customer' | 'supplier'

export interface CurrentAccountSummary {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  balance: number
  credit_limit?: number
  account_type: CurrentAccountType
}

export interface CurrentAccountsResponse {
  data: CurrentAccountSummary[]
  total: number
  page: number
  limit: number
}

export interface CurrentAccountEntry {
  id: string
  date: string
  type: 'opening_balance' | 'sale' | 'purchase' | 'payment' | 'return'
  description: string
  amount: number
  balance_effect: 'increase' | 'decrease'
  payment_method?: string | null
}

export interface CurrentAccountDetail {
  account_type: CurrentAccountType
  account: CurrentAccountSummary
  balance: number
  entries: CurrentAccountEntry[]
}

export interface CustomerPaymentInput {
  amount: number
  payment_method?: 'cash' | 'transfer' | 'bank'
  notes?: string
}
