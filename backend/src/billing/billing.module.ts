import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '@billing/entities/plan.entity';
import { Subscription } from '@billing/entities/subscription.entity';
import { BillingHistory } from '@billing/entities/billing-history.entity';
import { PendingSubscription } from '@billing/entities/pending-subscription.entity';
import { BillingService } from '@billing/billing.service';
import { BillingController } from '@billing/billing.controller';
import { CheckoutService } from '@billing/checkout.service';
import { CheckoutController } from '@billing/checkout.controller';
import { Tenant } from '@tenants/entities/tenant.entity';
import { User } from '@tenants/entities/user.entity';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([
      Plan, Subscription, BillingHistory, PendingSubscription, Tenant, User,
    ]),
  ],
  controllers: [BillingController, CheckoutController],
  providers: [BillingService, CheckoutService],
  exports: [BillingService, CheckoutService],
})
export class BillingModule {}
