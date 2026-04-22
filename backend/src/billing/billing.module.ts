import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '@billing/entities/plan.entity';
import { Subscription } from '@billing/entities/subscription.entity';
import { BillingHistory } from '@billing/entities/billing-history.entity';
import { PendingSubscription } from '@billing/entities/pending-subscription.entity';
import { Promotion } from '@billing/entities/promotion.entity';
import { BillingService } from '@billing/billing.service';
import { BillingController } from '@billing/billing.controller';
import { CheckoutService } from '@billing/checkout.service';
import { CheckoutController } from '@billing/checkout.controller';
import { PromotionService } from '@billing/promotion.service';
import { MailService } from '@common/services/mail.service';
import { Tenant } from '@tenants/entities/tenant.entity';
import { User } from '@tenants/entities/user.entity';
import { NotificationsModule } from '@notifications/notifications.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';

@Module({
  imports: [
    NotificationsModule,
    SystemSettingsModule,
    TypeOrmModule.forFeature([
      Plan, Subscription, BillingHistory, PendingSubscription, Promotion, Tenant, User,
    ]),
  ],
  controllers: [BillingController, CheckoutController],
  providers: [BillingService, CheckoutService, PromotionService, MailService],
  exports: [BillingService, CheckoutService, PromotionService],
})
export class BillingModule {}
