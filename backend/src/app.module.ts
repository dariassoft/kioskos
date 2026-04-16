import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/data-source';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenants/tenant.module';
import { BillingModule } from './billing/billing.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { AccountingModule } from './accounting/accounting.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { ElectronicInvoicingModule } from './electronic-invoicing/electronic-invoicing.module';
import { TenantMiddleware } from './tenants/tenant.middleware';

@Module({
  imports: [
    // ==========================================
    // CONFIGURACIÓN GLOBAL (lee .env)
    // ==========================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ==========================================
    // BASE DE DATOS — TypeORM portátil MySQL/Postgres
    // ==========================================
    TypeOrmModule.forRoot(dataSourceOptions),

    // ==========================================
    // EVENTOS ENTRE MÓDULOS (Event-Driven)
    // ==========================================
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
    }),

    // ==========================================
    // TAREAS PROGRAMADAS (Cron Jobs)
    // ==========================================
    ScheduleModule.forRoot(),

    // ==========================================
    // MÓDULOS DE NEGOCIO
    // ==========================================
    AuthModule,
    TenantModule,
    BillingModule,
    InventoryModule,
    SalesModule,
    AccountingModule,
    PurchasesModule,
    ReportsModule,
    NotificationsModule,
    SettingsModule,
    ElectronicInvoicingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        'api/v1/auth/(.*)',            // Login y registro son públicos
        'api/v1/checkout/plans',       // Planes públicos para la landing
        'api/v1/checkout/start',       // Iniciar checkout (pre-pago, sin auth)
        'api/v1/checkout/status/(.*)', // Estado del pago (polling público)
        'api/v1/checkout/confirm-transfer', // Confirmar transferencia (público)
        'api/v1/checkout/webhook/(.*)', // Webhooks de MercadoPago (sin tenant)
        'api/v1/checkout/sandbox-info', // Info de testing (público)
      )
      .forRoutes('*');     // Aplicar a todas las demás rutas
  }
}
