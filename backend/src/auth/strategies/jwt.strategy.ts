import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../tenants/entities/user.entity';
import { Tenant, TenantStatus } from '../../tenants/entities/tenant.entity';

export interface JwtPayload {
  sub: string;        // user ID
  email: string;
  role: string;
  tenant_id: string;  // Discriminador multi-tenant
  name: string;
  referral_code?: string;
}

/**
 * Estrategia JWT de Passport.
 * Extrae y valida el token Bearer del header Authorization.
 * El payload decodificado se inyecta en req.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Token inválido: usuario inactivo o inexistente');
    }
    if (!payload.tenant_id && user.role !== 'superadmin') {
      throw new UnauthorizedException('Token inválido: falta tenant_id');
    }
    if (user.role !== 'superadmin' && payload.tenant_id !== user.tenant_id) {
      throw new UnauthorizedException('Token inválido: el negocio no coincide');
    }
    const tenant = await this.tenantRepo.findOne({ where: { id: user.tenant_id } });
    if (!tenant || tenant.status === TenantStatus.SUSPENDED || tenant.status === TenantStatus.PAST_DUE) {
      throw new UnauthorizedException('El negocio está suspendido o tiene la suscripción vencida');
    }
    if (tenant.status === TenantStatus.TRIAL && tenant.trial_ends_at && tenant.trial_ends_at < new Date()) {
      throw new UnauthorizedException('El período de prueba del negocio ha finalizado');
    }
    // Lo que retorna aquí se convierte en req.user
    return {
      id: payload.sub,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      name: user.name,
      referral_code: payload.referral_code,
    };
  }
}
