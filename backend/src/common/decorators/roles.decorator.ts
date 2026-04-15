import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
}

export const ROLES_KEY = 'roles';

/**
 * Decorador para requerir roles específicos en un endpoint.
 *
 * Uso:
 *   @Roles(UserRole.ADMIN, UserRole.MANAGER)
 *   @Get()
 *   findAll() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
