"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const fs = require("fs");
const path = require("path");
async function ensureAuxiliaryTables(dataSource) {
    await dataSource.query(`
    CREATE TABLE IF NOT EXISTS \`mercadopago_credentials\` (
      \`id\` varchar(36) NOT NULL,
      \`tenant_id\` varchar(36) NOT NULL,
      \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      \`public_key\` varchar(200) NULL,
      \`access_token\` varchar(500) NULL,
      \`store_id\` varchar(100) NULL,
      \`pos_id\` varchar(100) NULL,
      \`is_sandbox\` tinyint NOT NULL DEFAULT 1,
      \`is_configured\` tinyint NOT NULL DEFAULT 0,
      \`last_verified_at\` timestamp NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`IDX_mp_credentials_tenant\` (\`tenant_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
    await dataSource.query(`
    CREATE TABLE IF NOT EXISTS \`afip_credentials\` (
      \`id\` varchar(36) NOT NULL,
      \`tenant_id\` varchar(36) NOT NULL,
      \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      \`auth_mode\` enum('certificate', 'access_token') NOT NULL DEFAULT 'certificate',
      \`cuit_encrypted\` varchar(500) NOT NULL,
      \`certificate_encrypted\` text NULL,
      \`private_key_encrypted\` text NULL,
      \`access_token_encrypted\` varchar(1000) NULL,
      \`punto_de_venta\` int NOT NULL,
      \`razon_social\` varchar(200) NOT NULL,
      \`tipo_iva\` enum('monotributista', 'responsable_inscripto') NOT NULL DEFAULT 'monotributista',
      \`production_mode\` tinyint NOT NULL DEFAULT 0,
      \`is_configured\` tinyint NOT NULL DEFAULT 0,
      \`last_cae_date\` timestamp NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`IDX_afip_credentials_tenant\` (\`tenant_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
    await dataSource.query(`
    CREATE TABLE IF NOT EXISTS \`electronic_invoices\` (
      \`id\` varchar(36) NOT NULL,
      \`tenant_id\` varchar(36) NOT NULL,
      \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      \`sale_id\` varchar(36) NULL,
      \`punto_de_venta\` int NOT NULL,
      \`tipo_comprobante\` int NOT NULL,
      \`numero_comprobante\` bigint NOT NULL,
      \`cae\` varchar(30) NOT NULL,
      \`cae_expiration\` date NOT NULL,
      \`fecha_comprobante\` date NOT NULL,
      \`concepto\` int NOT NULL DEFAULT 1,
      \`doc_tipo_receptor\` int NOT NULL DEFAULT 99,
      \`doc_nro_receptor\` bigint NOT NULL DEFAULT 0,
      \`nombre_receptor\` varchar(200) NULL,
      \`importe_total\` decimal(15,2) NOT NULL,
      \`importe_neto\` decimal(15,2) NOT NULL DEFAULT '0.00',
      \`importe_iva\` decimal(15,2) NOT NULL DEFAULT '0.00',
      \`alicuota_iva\` int NULL,
      \`moneda\` varchar(3) NOT NULL DEFAULT 'PES',
      \`afip_response\` json NULL,
      \`is_test\` tinyint NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`IDX_electronic_invoices_unique\` (\`tenant_id\`, \`punto_de_venta\`, \`tipo_comprobante\`, \`numero_comprobante\`),
      INDEX \`IDX_electronic_invoices_tenant\` (\`tenant_id\`),
      INDEX \`IDX_electronic_invoices_sale\` (\`sale_id\`),
      INDEX \`IDX_electronic_invoices_fecha\` (\`fecha_comprobante\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const dataSource = app.get(typeorm_1.DataSource);
    await ensureAuxiliaryTables(dataSource);
    if (configService.get('DB_RUN_MIGRATIONS') === 'true') {
        console.log('🔄 [DB] Ejecutando migraciones automáticamente...');
        try {
            await dataSource.runMigrations();
            console.log('✅ [DB] Migraciones completadas.');
        }
        catch (error) {
            console.error('❌ [DB] Error en migraciones:', error.message);
        }
    }
    if (configService.get('DB_RUN_SEED') === 'true') {
        console.log('🌱 [DB] Ejecutando carga de datos iniciales (seed)...');
        try {
            const seedFilePath = path.join(__dirname, 'database/seed.sql');
            if (fs.existsSync(seedFilePath)) {
                const seedSql = fs.readFileSync(seedFilePath, 'utf8');
                const queries = seedSql.split(';').map(q => q.trim()).filter(q => q.length > 0);
                for (const query of queries) {
                    await dataSource.query(query);
                }
                console.log('✅ [DB] Carga de datos completada (Seed).');
            }
            else {
                console.warn('⚠️ [DB] No se encontró el archivo seed.sql en:', seedFilePath);
            }
        }
        catch (error) {
            console.error('❌ [DB] Error al ejecutar el seed:', error.message);
        }
    }
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
    const port = Number(configService.get('APP_PORT') || 3000);
    await app.listen(port);
    console.log(`🚀 Kioskos & Despenzas API corriendo en: http://localhost:${port}/api/v1`);
    console.log(`📄 Swagger disponible en: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map