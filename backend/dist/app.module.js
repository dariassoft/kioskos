"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const data_source_1 = require("./database/data-source");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./auth/auth.module");
const tenant_module_1 = require("./tenants/tenant.module");
const billing_module_1 = require("./billing/billing.module");
const inventory_module_1 = require("./inventory/inventory.module");
const sales_module_1 = require("./sales/sales.module");
const accounting_module_1 = require("./accounting/accounting.module");
const purchases_module_1 = require("./purchases/purchases.module");
const reports_module_1 = require("./reports/reports.module");
const notifications_module_1 = require("./notifications/notifications.module");
const settings_module_1 = require("./settings/settings.module");
const electronic_invoicing_module_1 = require("./electronic-invoicing/electronic-invoicing.module");
const system_settings_module_1 = require("./system-settings/system-settings.module");
const expenses_module_1 = require("./expenses/expenses.module");
const production_module_1 = require("./production/production.module");
const tenant_middleware_1 = require("./tenants/tenant.middleware");
const feature_guard_1 = require("./common/guards/feature.guard");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(tenant_middleware_1.TenantMiddleware)
            .exclude('api/v1/auth/(.*)', 'api/v1/checkout/plans', 'api/v1/checkout/start', 'api/v1/checkout/status/(.*)', 'api/v1/checkout/confirm-transfer', 'api/v1/checkout/webhook/(.*)', 'api/v1/checkout/sandbox-info', 'api/v1/system-settings/public-info')
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env',
                ignoreEnvFile: false,
            }),
            typeorm_1.TypeOrmModule.forRoot(data_source_1.dataSourceOptions),
            event_emitter_1.EventEmitterModule.forRoot({
                wildcard: false,
                delimiter: '.',
                maxListeners: 20,
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            tenant_module_1.TenantModule,
            billing_module_1.BillingModule,
            inventory_module_1.InventoryModule,
            sales_module_1.SalesModule,
            accounting_module_1.AccountingModule,
            purchases_module_1.PurchasesModule,
            reports_module_1.ReportsModule,
            notifications_module_1.NotificationsModule,
            settings_module_1.SettingsModule,
            electronic_invoicing_module_1.ElectronicInvoicingModule,
            system_settings_module_1.SystemSettingsModule,
            expenses_module_1.ExpensesModule,
            production_module_1.ProductionModule,
        ],
        providers: [feature_guard_1.FeatureGuard],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map