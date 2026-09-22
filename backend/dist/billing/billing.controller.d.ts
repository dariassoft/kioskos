import { BillingService } from './billing.service';
import { PromotionService } from './promotion.service';
import { ChangePlanAdminDto, CreatePlanDto, RegisterPaymentAdminDto, UpdatePlanDto } from './dto/billing.dto';
export declare class BillingController {
    private readonly billingService;
    private readonly promotionService;
    constructor(billingService: BillingService, promotionService: PromotionService);
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
    getUpcomingCharges(days?: number): Promise<any[]>;
    getPlans(): Promise<import("./entities/plan.entity").Plan[]>;
    createPlan(dto: CreatePlanDto): Promise<import("./entities/plan.entity").Plan>;
    updatePlan(id: string, dto: UpdatePlanDto): Promise<import("./entities/plan.entity").Plan>;
    togglePlan(id: string): Promise<import("./entities/plan.entity").Plan>;
    getAllSubscriptions(): Promise<any[]>;
    getSubscription(tenantId: string): Promise<import("./entities/subscription.entity").Subscription | null>;
    changePlan(dto: ChangePlanAdminDto): Promise<import("./entities/subscription.entity").Subscription>;
    getMySubscription(tenantId: string): Promise<import("./entities/subscription.entity").Subscription | null>;
    cancelMySubscription(tenantId: string, body: {
        reason?: string;
    }): Promise<{
        message: string;
        access_until: string;
    }>;
    getMyBillingHistory(tenantId: string): Promise<import("./entities/billing-history.entity").BillingHistory[]>;
    getAllHistory(tenantId?: string): Promise<any[]>;
    getBillingHistory(tenantId: string): Promise<import("./entities/billing-history.entity").BillingHistory[]>;
    registerPayment(dto: RegisterPaymentAdminDto): Promise<import("./entities/billing-history.entity").BillingHistory>;
    getAllPromotions(): Promise<import("./entities/promotion.entity").Promotion[]>;
    createPromotion(body: any): Promise<import("./entities/promotion.entity").Promotion>;
    updatePromotion(id: string, body: any): Promise<import("./entities/promotion.entity").Promotion>;
    removePromotion(id: string): Promise<void>;
}
