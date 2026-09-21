export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  current_account_enabled?: boolean;
  opening_balance?: number;
  account_balance?: number;
}

export type CreateSupplierDto = Omit<Supplier, 'id'>;

export interface PurchaseOrderItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  vat_rate?: number;
  net_subtotal?: number;
  vat_amount?: number;
  subtotal: number;
  product?: {
    name: string;
  };
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  branch_id: string;
  total: number;
  status: 'pending' | 'received' | 'cancelled';
  created_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
  paid_amount?: number;
  payment_status?: 'paid' | 'pending';
}

export interface PurchasePayment { id: string; amount: number; payment_method: 'cash' | 'transfer' | 'bank'; notes?: string | null; created_at: string }

export type PurchaseReturnSettlement = 'credit_note' | 'cash_refund' | 'bank_refund'

export interface PurchaseReturnDto {
  items: { product_id: string; quantity: number }[]
  reason: string
  settlement_method: PurchaseReturnSettlement
}

export interface SupplierAccount {
  supplier: Supplier
  balance: number
  entries: { id: string; date: string; type: string; description: string; amount: number; direction: 'credit' | 'debit' }[]
}

export interface CreatePurchaseOrderDto {
  supplier_id: string;
  branch_id: string;
  items: {
    product_id: string;
    quantity: number;
    unit_cost: number;
    vat_rate?: number;
  }[];
}
