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

export interface CustomerPaymentInput {
  amount: number
  payment_method?: 'cash' | 'transfer' | 'bank'
  notes?: string
}

export type PaymentMethod =
  | 'cash'
  | 'debit_card'
  | 'credit_card'
  | 'transfer'
  | 'qr_mercadopago'
  | 'link_mercadopago'
  | 'credit_client'

export type PaymentStatus = 'pending' | 'confirmed' | 'failed'
export type SaleStatus = 'completed' | 'partially_refunded' | 'refunded' | 'pending'

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
  vat_rate?: number
  net_subtotal?: number
  vat_amount?: number
  product?: { name: string }
}

export interface Sale {
  id: string
  tenant_id: string
  branch_id: string
  user_id: string
  customer_id?: string
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  status: SaleStatus
  mp_payment_id?: string | null
  mp_payment_status?: string | null
  payer_name?: string | null
  payer_email?: string | null
  transfer_voucher?: string | null
  transfer_origin?: string | null
  card_last_digits?: string | null
  card_brand?: string | null
  authorization_code?: string | null
  payment_notes?: string | null
  payment_verified_at?: string | null
  voucher_image_url?: string | null
  created_at: string
  items: SaleItem[]
  customer?: Customer
}

export interface PaymentDetailsDto {
  mp_payment_id?: string
  mp_payment_status?: string
  payer_name?: string
  payer_email?: string
  transfer_voucher?: string
  transfer_origin?: string
  card_last_digits?: string
  card_brand?: string
  authorization_code?: string
  payment_notes?: string
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
  payment_status?: PaymentStatus
  payment_details?: PaymentDetailsDto
  items: CreateSaleItemDto[]
  request_invoice?: boolean
  invoice_doc_tipo?: number
  invoice_doc_nro?: string
}

export interface CreateSaleReturnDto {
  items: { product_id: string; quantity: number }[]
  reason: string
}

export interface ListSalesQuery {
  page?: number
  limit?: number
  payment_status?: PaymentStatus
  start_date?: string
  end_date?: string
  branch_id?: string
}

export interface SalesListResponse {
  data: Sale[]
  total: number
  page: number
  limit: number
}

export interface PaymentAccount {
  id: string
  tenant_id: string
  name: string
  type: 'alias' | 'cbu' | 'other'
  value: string
  is_active: boolean
}

export interface CreatePaymentAccountDto {
  name: string
  type: 'alias' | 'cbu' | 'other'
  value: string
  is_active?: boolean
}
