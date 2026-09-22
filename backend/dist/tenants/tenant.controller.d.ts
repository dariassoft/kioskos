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
    create(dto: CreateTenantDto): Promise<import("./entities/tenant.entity").Tenant>;
    updateStatus(id: string, dto: UpdateTenantStatusDto): Promise<import("./entities/tenant.entity").Tenant>;
}
