import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { BillingHistory } from './entities/billing-history.entity';
export declare class BillingService {
    private readonly planRepo;
    private readonly subscriptionRepo;
    private readonly billingRepo;
    constructor(planRepo: Repository<Plan>, subscriptionRepo: Repository<Subscription>, billingRepo: Repository<BillingHistory>);
    getActivePlans(): Promise<Plan[]>;
    createPlan(data: Partial<Plan>): Promise<Plan>;
    getActiveSubscription(tenantId: string): Promise<Subscription | null>;
    isFeatureEnabled(tenantId: string, feature: string): Promise<boolean>;
    getMrr(): Promise<{
        mrr: number;
        total_active: number;
    }>;
    checkExpiringSubscriptions(): Promise<void>;
    getBillingHistory(tenantId: string): Promise<BillingHistory[]>;
}
