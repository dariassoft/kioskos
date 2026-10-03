import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { BillingHistory } from '../billing/entities/billing-history.entity';
import { SystemSettingsModule } from '../system-settings/system-settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User, BillingHistory]), SystemSettingsModule],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
