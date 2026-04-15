import { BillingService } from './billing.service';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    getPlans(): Promise<import("./entities/plan.entity").Plan[]>;
    createPlan(body: any): Promise<import("./entities/plan.entity").Plan>;
    getSubscription(tenantId: string): Promise<import("./entities/subscription.entity").Subscription | null>;
    getBillingHistory(tenantId: string): Promise<import("./entities/billing-history.entity").BillingHistory[]>;
}
