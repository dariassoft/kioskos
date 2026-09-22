import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Decorador para extraer el tenantId del request en controladores.
 *
 * Uso:
 *   @Get()
 *   findAll(@GetTenantId() tenantId: string) { ... }
 *
 * El valor es inyectado por el TenantMiddleware, que lo extrae del JWT.
 * NUNCA aceptar el tenant_id desde el body del request.
 */
export const GetTenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.tenantId ?? request.user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('No se pudo identificar el negocio actual');
    }
    return tenantId;
  },
);
