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
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      name: user.name,
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
  ): Promise<{ access_token: string; user: object }> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const password_hash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      ...dto,
      password_hash,
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
