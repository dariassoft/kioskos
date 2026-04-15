"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.enableCors({
        origin: [
            configService.get('FRONTEND_URL') || 'http://localhost:5173',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.setGlobalPrefix('api/v1');
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Kioskos & Despenzas API')
        .setDescription('ERP/POS SaaS Multi-tenant para Kioskos y Despenzas')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
        .addTag('auth', 'Autenticación y autorización')
        .addTag('tenants', 'Gestión de negocios (SuperAdmin)')
        .addTag('billing', 'Suscripciones y facturación (SuperAdmin)')
        .addTag('inventory', 'Productos, stock y sucursales')
        .addTag('sales', 'POS, ventas y caja registradora')
        .addTag('customers', 'Clientes y fiados')
        .addTag('purchases', 'Compras y proveedores')
        .addTag('accounting', 'Asientos contables')
        .addTag('reports', 'Reportes y exportaciones')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = configService.get('APP_PORT') || 3000;
    await app.listen(port);
    console.log(`🚀 Kioskos & Despenzas API corriendo en: http://localhost:${port}/api/v1`);
    console.log(`📄 Swagger disponible en: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map