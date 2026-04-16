import { BillingService } from './billing.service';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    getMrr(): Promise<{
        mrr: number;
        total_active: number;
        total_tenants: number;
        expiring_soon: number;
        monthly_revenue: {
            month: string;
            revenue: number;
        }[];
    }>;
    getExpiring(days?: number): Promise<any[]>;
    getPlans(): Promise<import("./entities/plan.entity").Plan[]>;
    createPlan(body: any): Promise<import("./entities/plan.entity").Plan>;
    updatePlan(id: string, body: any): Promise<import("./entities/plan.entity").Plan>;
    togglePlan(id: string): Promise<import("./entities/plan.entity").Plan>;
    getAllSubscriptions(): Promise<any[]>;
    getSubscription(tenantId: string): Promise<import("./entities/subscription.entity").Subscription | null>;
    changePlan(body: {
        tenant_id: string;
        new_plan_id: string;
    }): Promise<import("./entities/subscription.entity").Subscription>;
    getAllHistory(tenantId?: string): Promise<any[]>;
    getBillingHistory(tenantId: string): Promise<import("./entities/billing-history.entity").BillingHistory[]>;
    registerPayment(body: {
        tenant_id: string;
        amount: number;
        payment_method: string;
        notes?: string;
        months?: number;
    }): Promise<import("./entities/billing-history.entity").BillingHistory>;
}
