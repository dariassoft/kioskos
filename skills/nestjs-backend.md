# Reglas de Desarrollo: Backend (NestJS + TypeORM)

## Arquitectura y Estructura
- Mantener una arquitectura modular fuerte en NestJS. Cada área de negocio pertenece a su propio módulo (ej. `SalesModule`, `InventoryModule`).
- Uso estricto de Servicios y Controladores. Los controladores solo manejan la solicitud HTTP y devuelven respuestas. Toda la lógica de negocio vive en los Providers/Services.
- Nunca inyectar un servicio `B` en `A` si no fue exportado por el framework; usar inyección de dependencias `constructor(private readonly moduleService: ModuleService)`.

## Base de Datos (TypeORM & MySQL)
- Diseñar entidades extendiendo `BaseG360Entity` o incluyendo siempre clases base con `id`, `tenant_id`, `created_at`, `updated_at`.
- Para inyección de parámetros usar `QueryBuilder` o el repositorio estándar, siempre evitando inyección SQL.
- El `tenant_id` debe ser extraído sistemáticamente del request (`@GetTenantId()`) y obligatoriamente anexado a CADA consulta `where: { tenant_id }` o insert de repositorio.
- Usar migraciones en entornos de producción, NUNCA confiar en `DB_SYNCHRONIZE=true` fuera de `development`.

## Seguridad y Validación
- Todo endpoint privado debe estar envuelto en `@UseGuards(JwtAuthGuard)`.
- Validar Payload (Cuerpo de solicitud) usando `class-validator` y `class-transformer` dentro de los DTOs.
- Las propiedades no tipadas deben ser descartadas (usar `whitelist: true` en los pipes globales).
- Limitar el manejo manual de contraseñas, en su lugar instanciar el uso de `bcryptjs` en `AuthService`.

## Respuestas y Errores
- Configurar decoradores Swagger (`@ApiOperation`, `@ApiResponse`) en cada endpoint.
- Proveer errores legibles usando Excepciones Nativas de NestJS (Ej: `NotFoundException`, `UnauthorizedException`) para que los Filtros de Error de la App atrapen un comportamiento consistente.
