import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: object;
    }>;
    register(dto: RegisterDto, tenantId: string): Promise<{
        access_token: string;
        user: object;
    }>;
    getProfile(request: {
        user: {
            id: string;
        };
    }): Promise<Partial<import("../tenants/entities/user.entity").User>>;
}
