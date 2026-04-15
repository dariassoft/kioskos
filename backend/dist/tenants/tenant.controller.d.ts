import { TenantService } from './tenant.service';
import { TenantStatus } from './entities/tenant.entity';
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
    create(body: any): Promise<import("./entities/tenant.entity").Tenant>;
    updateStatus(id: string, status: TenantStatus): Promise<import("./entities/tenant.entity").Tenant>;
}
