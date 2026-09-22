import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../tenants/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantStatus } from '../tenants/entities/tenant.entity';
import { Branch } from '../inventory/entities/branch.entity';
import { UserRole } from '../common/decorators/roles.decorator';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    private readonly jwtService: JwtService,
  ) {}

  // ==========================================
  // LOGIN
  // ==========================================
  async login(dto: LoginDto): Promise<{ access_token: string; user: object }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Credenciales incorrectas o usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const tenant = await this.tenantRepo.findOne({ where: { id: user.tenant_id } });
    if (!tenant || tenant.status === TenantStatus.SUSPENDED || tenant.status === TenantStatus.PAST_DUE) {
      throw new UnauthorizedException('El negocio está suspendido o tiene la suscripción vencida');
    }
    if (tenant.status === TenantStatus.TRIAL && tenant.trial_ends_at && tenant.trial_ends_at < new Date()) {
      throw new UnauthorizedException('El período de prueba del negocio ha finalizado');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      name: user.name,
      referral_code: tenant?.referral_code,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        branch_id: user.branch_id,
        referral_code: tenant?.referral_code,
      },
    };
  }

  // ==========================================
  // REGISTRO (nuevo usuario para un tenant existente)
  // Nota: Crear el primer usuario (OWNER) se hace desde el módulo de Tenants
  // ==========================================
  async register(
    dto: RegisterDto,
    tenantId: string,
    role: UserRole = UserRole.CASHIER,
  ): Promise<{ access_token: string; user: object }> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    if (dto.branch_id) {
      const branch = await this.branchRepo.findOne({
        where: { id: dto.branch_id, tenant_id: tenantId },
      });
      if (!branch) throw new ConflictException('La sucursal no pertenece al negocio actual');
    }

    const password_hash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      ...dto,
      password_hash,
      role,
      tenant_id: tenantId, // Siempre del JWT/contexto, nunca del body
    });

    await this.userRepo.save(user);

    return this.login({ email: dto.email, password: dto.password });
  }

  // ==========================================
  // OBTENER PERFIL DEL USUARIO AUTENTICADO
  // ==========================================
  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const { password_hash, ...profile } = user;
    return profile;
  }
}
