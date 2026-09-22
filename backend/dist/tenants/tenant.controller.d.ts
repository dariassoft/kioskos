import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantStatusDto } from './dto/tenant.dto';
export declare class TenantController {
    private readonly tenantService;
    constructor(tenantService: TenantService);
    findAll(): Promise<import("./entities/tenant.entity").Tenant[]>;
    getMetrics(): Promise<{
        total: number;
        active: number;
        trial: number;
        suspended: number;
    }>;
    findOne(id: string): Promise<import("./entities/tenant.entity").Tenant>;
    create(dto: CreateTenantDto): Promise<{
        tenant: import("./entities/tenant.entity").Tenant;
        owner: {
            id: string;
            tenant_id: string | null;
            branch_id: string;
            name: string;
            email: string;
            role: string;
            is_active: boolean;
            created_at: Date;
            updated_at: Date;
        };
        branch: import("../inventory/entities/branch.entity").Branch;
        subscription: import("../billing/entities/subscription.entity").Subscription;
    }>;
    updateStatus(id: string, dto: UpdateTenantStatusDto): Promise<import("./entities/tenant.entity").Tenant>;
}
