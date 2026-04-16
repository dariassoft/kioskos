import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '@inventory/entities/branch.entity';
import { User } from '@tenants/entities/user.entity';
import { Tenant } from '@tenants/entities/tenant.entity';
import { Subscription } from '@billing/entities/subscription.entity';
import { Plan } from '@billing/entities/plan.entity';
import { MercadopagoCredentials } from '@sales/entities/mercadopago-credentials.entity';
import { SettingsService } from './settings.service';
import { SettingsMercadopagoService } from './settings-mercadopago.service';
import { SettingsController } from './settings.controller';
@Module({
  imports: [
    TypeOrmModule.forFeature([Branch, User, Tenant, Subscription, Plan, MercadopagoCredentials]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsMercadopagoService],
  exports: [SettingsService, SettingsMercadopagoService],
})
export class SettingsModule {}
