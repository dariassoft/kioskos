export declare enum TenantStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    TRIAL = "trial",
    PAST_DUE = "past_due"
}
export declare class Tenant {
    id: string;
    business_name: string;
    tax_id: string;
    owner_email: string;
    logo_url: string;
    status: TenantStatus;
    phone: string;
    address: string;
    created_at: Date;
    updated_at: Date;
}
