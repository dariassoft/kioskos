import { createParamDecorator, ExecutionContext } from '@nestjs/common';

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
    return (request.tenantId ?? request.user?.tenant_id ?? null) as string;
  },
);
