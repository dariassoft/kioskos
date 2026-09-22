import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../tenants/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Branch } from '../inventory/entities/branch.entity';
import { UserRole } from '../common/decorators/roles.decorator';
import { Subscription } from '../billing/entities/subscription.entity';
import { Plan } from '../billing/entities/plan.entity';
export declare class AuthService {
    private readonly userRepo;
    private readonly tenantRepo;
    private readonly branchRepo;
    private readonly subscriptionRepo;
    private readonly planRepo;
    private readonly jwtService;
    constructor(userRepo: Repository<User>, tenantRepo: Repository<Tenant>, branchRepo: Repository<Branch>, subscriptionRepo: Repository<Subscription>, planRepo: Repository<Plan>, jwtService: JwtService);
    private validateUserLimit;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: object;
    }>;
    register(dto: RegisterDto, tenantId: string, role?: UserRole, enforcePlanLimit?: boolean): Promise<{
        access_token: string;
        user: object;
    }>;
    getProfile(userId: string): Promise<Partial<User>>;
}
