export declare enum SubscriptionStatus {
    ACTIVE = "active",
    CANCELLED = "cancelled",
    SUSPENDED = "suspended",
    PAST_DUE = "past_due"
}
export declare class Subscription {
    id: string;
    tenant_id: string;
    plan_id: string;
    start_date: Date;
    end_date: Date;
    auto_renew: boolean;
    last_payment_date: Date;
    next_billing_date: Date;
    discount_percentage: number;
    discount_ends_at: Date | null;
    locked_price: number | null;
    locked_plan_name: string | null;
    billing_day: number;
    status: SubscriptionStatus;
    cancelled_at: Date | null;
    cancellation_reason: string | null;
    promotion_id: string | null;
    price_after_promo: number | null;
    promo_ends_at: Date | null;
    mp_preapproval_id: string | null;
    created_at: Date;
    updated_at: Date;
}
