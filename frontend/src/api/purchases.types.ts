export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
}

export type CreateSupplierDto = Omit<Supplier, 'id'>;

export interface PurchaseOrderItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
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
}

export interface PurchasePayment { id: string; amount: number; payment_method: 'cash' | 'transfer' | 'bank'; notes?: string | null; created_at: string }

export interface CreatePurchaseOrderDto {
  supplier_id: string;
  branch_id: string;
  items: {
    product_id: string;
    quantity: number;
    unit_cost: number;
  }[];
}
