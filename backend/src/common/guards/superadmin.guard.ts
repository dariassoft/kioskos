import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../decorators/roles.decorator';

/**
 * Guard exclusivo para el panel del dueño de la aplicación.
 * Solo usuarios con rol SUPERADMIN pueden pasar.
 * Se aplica en TenantModule y BillingModule.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        'Acceso restringido al panel de administración de la plataforma.',
      );
    }

    return true;
  }
}
