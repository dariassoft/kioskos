import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;        // user ID
  email: string;
  role: string;
  tenant_id: string;  // Discriminador multi-tenant
  name: string;
}

/**
 * Estrategia JWT de Passport.
 * Extrae y valida el token Bearer del header Authorization.
 * El payload decodificado se inyecta en req.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.tenant_id && payload.role !== 'superadmin') {
      throw new UnauthorizedException('Token inválido: falta tenant_id');
    }
    // Lo que retorna aquí se convierte en req.user
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenant_id: payload.tenant_id,
      name: payload.name,
    };
  }
}
