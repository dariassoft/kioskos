import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ==========================================
  // CORS — Permitir frontend en dev y prod
  // ==========================================
  app.enableCors({
    origin: [
      configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ==========================================
  // VALIDACIÓN GLOBAL DE DTOs
  // ==========================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // Elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true,
      transform: true,         // Convierte strings a tipos correctos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ==========================================
  // PREFIX GLOBAL DE API
  // ==========================================
  app.setGlobalPrefix('api/v1');

  // ==========================================
  // SWAGGER (OpenAPI)
  // ==========================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kioskos & Despenzas API')
    .setDescription('ERP/POS SaaS Multi-tenant para Kioskos y Despenzas')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
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

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // ==========================================
  // ARRANQUE
  // ==========================================
  const port = configService.get<number>('APP_PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 Kioskos & Despenzas API corriendo en: http://localhost:${port}/api/v1`);
  console.log(`📄 Swagger disponible en: http://localhost:${port}/api/docs`);
}

bootstrap();
