import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { BillingService } from '../../billing/billing.service';
import { FEATURE_METADATA_KEY } from '../decorators/feature.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<string>(FEATURE_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!feature) return true;

    const request = context.switchToHttp().getRequest<{ user?: { role?: string; tenant_id?: string } }>();
    if (request.user?.role === 'superadmin') return true;
    const billingService = this.moduleRef.get(BillingService, { strict: false });
    if (!request.user?.tenant_id || !(await billingService.isFeatureEnabled(request.user.tenant_id, feature))) {
      throw new ForbiddenException('El módulo no está habilitado para el plan o está desactivado globalmente');
    }
    return true;
  }
}