export interface Customer {
  id: string
  tenant_id: string
  name: string
  email?: string
  phone?: string
  credit_limit: number
  current_debt: number
  created_at: string
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'credit_client'
export type SaleStatus = 'completed' | 'refunded' | 'pending'

export interface CashRegister {
  id: string
  tenant_id: string
  branch_id: string
  user_id: string
  opening_balance: number
  closing_balance?: number
  cash_sales: number
  status: 'open' | 'closed'
  opened_at: string
  closed_at?: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Sale {
  id: string
  tenant_id: string
  branch_id: string
  user_id: string
  customer_id?: string
  total: number
  payment_method: PaymentMethod
  status: SaleStatus
  created_at: string
  items: SaleItem[]
  customer?: Customer
}

export interface CreateSaleItemDto {
  product_id: string
  quantity: number
  unit_price: number
}

export interface CreateSaleDto {
  branch_id: string
  customer_id?: string
  payment_method: PaymentMethod
  items: CreateSaleItemDto[]
}
