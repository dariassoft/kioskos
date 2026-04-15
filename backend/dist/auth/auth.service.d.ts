import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../tenants/entities/user.entity';
export declare class AuthService {
    private readonly userRepo;
    private readonly jwtService;
    constructor(userRepo: Repository<User>, jwtService: JwtService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: object;
    }>;
    register(dto: RegisterDto, tenantId: string): Promise<{
        access_token: string;
        user: object;
    }>;
    getProfile(userId: string): Promise<Partial<User>>;
}
