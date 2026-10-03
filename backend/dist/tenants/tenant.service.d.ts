import { DataSource, Repository } from 'typeorm';
import { Tenant, TenantStatus } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/tenant.dto';
import { Branch } from '../inventory/entities/branch.entity';
import { Subscription } from '../billing/entities/subscription.entity';
import { SystemSettingsService } from '../system-settings/system-settings.service';
export declare class TenantService {
    private readonly tenantRepo;
    private readonly dataSource;
    private readonly systemSettings;
    constructor(tenantRepo: Repository<Tenant>, dataSource: DataSource, systemSettings: SystemSettingsService);
    findAll(): Promise<Tenant[]>;
    findOne(id: string): Promise<Tenant>;
    create(data: CreateTenantDto): Promise<{
        tenant: Tenant;
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
        branch: Branch;
        subscription: Subscription;
    }>;
    updateStatus(id: string, status: TenantStatus): Promise<Tenant>;
    getMetrics(): Promise<{
        total: number;
        active: number;
        trial: number;
        suspended: number;
    }>;
}
