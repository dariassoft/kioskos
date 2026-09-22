import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../tenants/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    tenant_id?: string;
    name: string;
    referral_code?: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private readonly userRepo;
    private readonly tenantRepo;
    constructor(configService: ConfigService, userRepo: Repository<User>, tenantRepo: Repository<Tenant>);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        role: string;
        tenant_id: string | undefined;
        name: string;
        referral_code: string | undefined;
    }>;
}
export {};
