import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from './entities/tenant.entity';
export declare class TenantService {
    private readonly tenantRepo;
    constructor(tenantRepo: Repository<Tenant>);
    findAll(): Promise<Tenant[]>;
    findOne(id: string): Promise<Tenant>;
    create(data: Partial<Tenant>): Promise<Tenant>;
    updateStatus(id: string, status: TenantStatus): Promise<Tenant>;
    getMetrics(): Promise<{
        total: number;
        active: number;
        trial: number;
        suspended: number;
    }>;
}
