export declare enum PaymentStatus {
    PAID = "paid",
    PENDING = "pending",
    FAILED = "failed"
}
export declare class BillingHistory {
    id: string;
    tenant_id: string;
    amount: number;
    payment_status: PaymentStatus;
    payment_method: string;
    invoice_url: string;
    created_at: Date;
}
