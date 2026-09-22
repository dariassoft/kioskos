import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../tenants/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Branch } from '../inventory/entities/branch.entity';
import { UserRole } from '../common/decorators/roles.decorator';
export declare class AuthService {
    private readonly userRepo;
    private readonly tenantRepo;
    private readonly branchRepo;
    private readonly jwtService;
    constructor(userRepo: Repository<User>, tenantRepo: Repository<Tenant>, branchRepo: Repository<Branch>, jwtService: JwtService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: object;
    }>;
    register(dto: RegisterDto, tenantId: string, role?: UserRole): Promise<{
        access_token: string;
        user: object;
    }>;
    getProfile(userId: string): Promise<Partial<User>>;
}
