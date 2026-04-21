"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function ensureAuxiliaryTables(dataSource) {
    await dataSource.query(`
    CREATE TABLE IF NOT EXISTS \`mercadopago_credentials\` (
      \`id\` varchar(36) NOT NULL,
      \`tenant_id\` varchar(36) NOT NULL,
      \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      \`public_key\` varchar(200) NULL,
      \`access_token\` varchar(500) NULL,
      \`refresh_token\` varchar(500) NULL,
      \`mp_user_id\` varchar(100) NULL,
      \`token_expires_at\` timestamp NULL,
      \`store_id\` varchar(100) NULL,
      \`pos_id\` varchar(100) NULL,
      \`is_sandbox\` tinyint NOT NULL DEFAULT 1,
      \`is_configured\` tinyint NOT NULL DEFAULT 0,
      \`last_verified_at\` timestamp NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`IDX_mp_credentials_tenant\` (\`tenant_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
    const tables = await dataSource.query(`SHOW COLUMNS FROM \`mercadopago_credentials\``);
    const columnNames = tables.map((c) => c.Field);
    if (!columnNames.includes('refresh_token')) {
        await dataSource.query('ALTER TABLE `mercadopago_credentials` ADD COLUMN `refresh_token` varchar(500) NULL');
    }
    if (!columnNames.includes('mp_user_id')) {
        await dataSource.query('ALTER TABLE `mercadopago_credentials` ADD COLUMN `mp_user_id` varchar(100) NULL');
    }
    if (!columnNames.includes('token_expires_at')) {
        await dataSource.query('ALTER TABLE `mercadopago_credentials` ADD COLUMN `token_expires_at` timestamp NULL');
    }
    const tenantColumns = await dataSource.query('SHOW COLUMNS FROM `tenants`');
    const tenantColumnNames = tenantColumns.map((c) => c.Field);
    if (!tenantColumnNames.includes('referral_code')) {
        await dataSource.query('ALTER TABLE `tenants` ADD COLUMN `referral_code` varchar(20) NULL');
    }
    if (!tenantColumnNames.includes('referred_by_id')) {
        await dataSource.query('ALTER TABLE `tenants` ADD COLUMN `referred_by_id` varchar(36) NULL');
    }
    if (!tenantColumnNames.includes('settings')) {
        await dataSource.query('ALTER TABLE `tenants` ADD COLUMN `settings` json NULL');
    }
    if (!tenantColumnNames.includes('trial_ends_at')) {
        await dataSource.query('ALTER TABLE `tenants` ADD COLUMN `trial_ends_at` timestamp NULL');
    }
    const subColumns = await dataSource.query('SHOW COLUMNS FROM `subscriptions`');
    const subColumnNames = subColumns.map((c) => c.Field);
    if (!subColumnNames.includes('discount_percentage')) {
        await dataSource.query('ALTER TABLE `subscriptions` ADD COLUMN `discount_percentage` decimal(5,2) DEFAULT 0');
    }
    if (!subColumnNames.includes('discount_ends_at')) {
        await dataSource.query('ALTER TABLE `subscriptions` ADD COLUMN `discount_ends_at` date NULL');
    }
    const pendingColumns = await dataSource.query('SHOW COLUMNS FROM `pending_subscriptions`');
    const pendingColumnNames = pendingColumns.map((c) => c.Field);
    if (!pendingColumnNames.includes('referred_by_code')) {
        await dataSource.query('ALTER TABLE `pending_subscriptions` ADD COLUMN `referred_by_code` varchar(10) NULL');
    }
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
    await dataSource.query(`
    CREATE TABLE IF NOT EXISTS \`system_settings\` (
      \`key\` varchar(100) NOT NULL,
      \`value\` text NOT NULL,
      \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`key\`)
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
    app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
        prefix: '/uploads/',
    });
    const port = Number(configService.get('APP_PORT') || 3000);
    await app.listen(port);
    console.log(`🚀 Kioskos & Despenzas API corriendo en: http://localhost:${port}/api/v1`);
    console.log(`📄 Swagger disponible en: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map