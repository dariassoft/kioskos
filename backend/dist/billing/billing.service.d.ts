import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { BillingHistory } from './entities/billing-history.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { ConfigService } from '@nestjs/config';
export interface RegisterPaymentDto {
    tenant_id: string;
    amount: number;
    payment_method: string;
    notes?: string;
    months?: number;
}
export interface ChangePlanDto {
    tenant_id: string;
    new_plan_id: string;
}
export declare class BillingService {
    private readonly planRepo;
    private readonly subscriptionRepo;
    private readonly billingRepo;
    private readonly tenantRepo;
    private readonly config;
    private readonly logger;
    constructor(planRepo: Repository<Plan>, subscriptionRepo: Repository<Subscription>, billingRepo: Repository<BillingHistory>, tenantRepo: Repository<Tenant>, config: ConfigService);
    private readonly mp;
    getActivePlans(): Promise<Plan[]>;
    getAllPlans(): Promise<Plan[]>;
    createPlan(data: Partial<Plan>): Promise<Plan>;
    updatePlan(id: string, data: Partial<Plan>): Promise<Plan>;
    togglePlanStatus(id: string): Promise<Plan>;
    getActiveSubscription(tenantId: string): Promise<Subscription | null>;
    getAllSubscriptionsWithDetails(): Promise<any[]>;
    changePlan(dto: ChangePlanDto): Promise<Subscription>;
    isFeatureEnabled(tenantId: string, feature: string): Promise<boolean>;
    cancelSubscription(tenantId: string, reason?: string): Promise<{
        message: string;
        access_until: string;
    }>;
    getUpcomingCharges(days?: number): Promise<any[]>;
    registerPayment(dto: RegisterPaymentDto): Promise<BillingHistory>;
    getAllBillingHistory(tenantId?: string): Promise<any[]>;
    getBillingHistory(tenantId: string): Promise<BillingHistory[]>;
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
    getExpiringSubscriptions(days?: number): Promise<any[]>;
    checkExpiringSubscriptions(): Promise<void>;
    handlePromoTransitions(): Promise<void>;
    calculateProration(fullPrice: number, subscriptionDate: Date): {
        prorated_amount: number;
        first_end_date: Date;
    };
}
