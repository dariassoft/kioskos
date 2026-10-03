import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { BillingHistory } from './entities/billing-history.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { ConfigService } from '@nestjs/config';
import { SystemSettingsService } from '../system-settings/system-settings.service';
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
export declare class BillingService implements OnModuleInit {
    private readonly planRepo;
    private readonly subscriptionRepo;
    private readonly billingRepo;
    private readonly tenantRepo;
    private readonly config;
    private readonly systemSettings;
    private readonly logger;
    constructor(planRepo: Repository<Plan>, subscriptionRepo: Repository<Subscription>, billingRepo: Repository<BillingHistory>, tenantRepo: Repository<Tenant>, config: ConfigService, systemSettings: SystemSettingsService);
    private readonly mp;
    onModuleInit(): Promise<void>;
    getActivePlans(): Promise<Plan[]>;
    getEffectivePublicPlans(): Promise<Plan[]>;
    getAllPlans(): Promise<Plan[]>;
    createPlan(data: Partial<Plan>): Promise<Plan>;
    private formatFeatureDependencyError;
    updatePlan(id: string, data: Partial<Plan>): Promise<Plan>;
    togglePlanStatus(id: string): Promise<Plan>;
    getActiveSubscription(tenantId: string): Promise<Subscription | null>;
    getAllSubscriptionsWithDetails(): Promise<any[]>;
    changePlan(dto: ChangePlanDto): Promise<Subscription>;
    isFeatureEnabled(tenantId: string, feature: string): Promise<boolean>;
    private getGlobalFeatureStates;
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
    private getMercadoPagoClient;
    calculateProration(fullPrice: number, subscriptionDate: Date): {
        prorated_amount: number;
        first_end_date: Date;
    };
}
