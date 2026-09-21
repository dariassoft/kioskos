export declare class CreateSupplierDto {
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    tax_id?: string;
    current_account_enabled?: boolean;
    opening_balance?: number;
}
export declare class UpdateSupplierDto extends CreateSupplierDto {
}
export declare class SupplierCurrentAccountsQueryDto {
    search?: string;
    page?: number;
    limit?: number;
}
export declare class CreatePurchaseOrderItemDto {
    product_id: string;
    quantity: number;
    unit_cost: number;
    vat_rate?: number;
}
export declare class CreatePurchaseOrderDto {
    supplier_id: string;
    branch_id: string;
    items: CreatePurchaseOrderItemDto[];
}
export declare class UpdatePurchaseOrderDto extends CreatePurchaseOrderDto {
}
export declare class ReceivePurchaseOrderDto {
    items: CreatePurchaseOrderItemDto[];
}
export declare enum PurchaseReturnSettlementDto {
    CREDIT_NOTE = "credit_note",
    CASH_REFUND = "cash_refund",
    BANK_REFUND = "bank_refund"
}
export declare class CreatePurchaseReturnItemDto {
    product_id: string;
    quantity: number;
}
export declare class CreatePurchaseReturnDto {
    items: CreatePurchaseReturnItemDto[];
    reason: string;
    settlement_method: PurchaseReturnSettlementDto;
}
export declare class CreatePurchasePaymentDto {
    amount: number;
    payment_method: 'cash' | 'transfer' | 'bank';
    notes?: string;
}
