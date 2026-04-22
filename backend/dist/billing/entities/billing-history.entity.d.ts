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
    payment_method: string | null;
    invoice_url: string | null;
    plan_id: string | null;
    plan_name: string | null;
    billing_period_start: Date | null;
    billing_period_end: Date | null;
    is_prorated: boolean;
    promotion_id: string | null;
    created_at: Date;
}
