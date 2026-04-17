import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountingLedger } from './entities/accounting-ledger.entity';
import { Sale } from '@sales/entities/sale.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { AccountingListener } from './accounting.listener';

@Module({
  imports: [TypeOrmModule.forFeature([AccountingLedger, Sale, Tenant])],
  controllers: [AccountingController],
  providers: [AccountingService, AccountingListener],
})
export class AccountingModule {}
