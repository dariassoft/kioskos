export declare class CreateSupplierDto {
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    tax_id?: string;
}
export declare class UpdateSupplierDto extends CreateSupplierDto {
}
export declare class CreatePurchaseOrderItemDto {
    product_id: string;
    quantity: number;
    unit_cost: number;
}
export declare class CreatePurchaseOrderDto {
    supplier_id: string;
    branch_id: string;
    items: CreatePurchaseOrderItemDto[];
}
export declare class CreatePurchasePaymentDto {
    amount: number;
    payment_method: 'cash' | 'transfer' | 'bank';
    notes?: string;
}
