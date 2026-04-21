"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const plan_entity_1 = require("./entities/plan.entity");
const subscription_entity_1 = require("./entities/subscription.entity");
const billing_history_entity_1 = require("./entities/billing-history.entity");
const pending_subscription_entity_1 = require("./entities/pending-subscription.entity");
const billing_service_1 = require("./billing.service");
const billing_controller_1 = require("./billing.controller");
const checkout_service_1 = require("./checkout.service");
const checkout_controller_1 = require("./checkout.controller");
const mail_service_1 = require("../common/services/mail.service");
const tenant_entity_1 = require("../tenants/entities/tenant.entity");
const user_entity_1 = require("../tenants/entities/user.entity");
const notifications_module_1 = require("../notifications/notifications.module");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            notifications_module_1.NotificationsModule,
            typeorm_1.TypeOrmModule.forFeature([
                plan_entity_1.Plan, subscription_entity_1.Subscription, billing_history_entity_1.BillingHistory, pending_subscription_entity_1.PendingSubscription, tenant_entity_1.Tenant, user_entity_1.User,
            ]),
        ],
        controllers: [billing_controller_1.BillingController, checkout_controller_1.CheckoutController],
        providers: [billing_service_1.BillingService, checkout_service_1.CheckoutService, mail_service_1.MailService],
        exports: [billing_service_1.BillingService, checkout_service_1.CheckoutService],
    })
], BillingModule);
//# sourceMappingURL=billing.module.js.map