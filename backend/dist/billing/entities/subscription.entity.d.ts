export declare class Subscription {
    id: string;
    tenant_id: string;
    plan_id: string;
    start_date: Date;
    end_date: Date;
    auto_renew: boolean;
    last_payment_date: Date;
    next_billing_date: Date;
    created_at: Date;
    updated_at: Date;
}
