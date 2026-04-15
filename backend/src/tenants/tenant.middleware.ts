import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, NextFunction } from 'express';

// Extender el tipo Request de Express para incluir tenantId
interface RequestWithTenant extends Request {
  tenantId: string | null;
  user?: any;
}

/**
 * TenantMiddleware — El corazón de la seguridad multi-tenant.
 *
 * Se ejecuta en CADA request (excepto rutas de auth).
 * Extrae el tenant_id del usuario autenticado (ya verificado por JwtStrategy)
 * y lo inyecta en req.tenantId para su uso en controladores y servicios.
 *
 * REGLA CRÍTICA: El tenant_id NUNCA debe venir del body de la petición.
 * Siempre debe extraerse del JWT decodificado.
 *
 * Los SuperAdmins no tienen tenant_id propio — tienen acceso global.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: RequestWithTenant, res: Response, next: NextFunction) {
    const user = req.user as any;

    if (!user) {
      // El request no ha pasado por el JwtAuthGuard todavía.
      // Esto puede pasar en rutas públicas — dejamos pasar.
      return next();
    }

    // Los SuperAdmins tienen acceso global (sin tenant_id)
    if (user.role === 'superadmin') {
      req['tenantId'] = null;
      return next();
    }

    if (!user.tenant_id) {
      throw new UnauthorizedException(
        'No se pudo identificar el negocio (Tenant). Token inválido.',
      );
    }

    // Inyectar el tenantId en el request para uso posterior
    req['tenantId'] = user.tenant_id;

    next();
  }
}
