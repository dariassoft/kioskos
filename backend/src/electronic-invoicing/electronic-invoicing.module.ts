import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AfipCredentials } from './entities/afip-credentials.entity';
import { ElectronicInvoice } from './entities/electronic-invoice.entity';
import { ElectronicInvoicingService } from './electronic-invoicing.service';
import { ElectronicInvoicingController } from './electronic-invoicing.controller';

// BillingModule exporta BillingService para validar features por plan
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AfipCredentials, ElectronicInvoice]),
    BillingModule, // Necesario para BillingService.isFeatureEnabled()
  ],
  controllers: [ElectronicInvoicingController],
  providers: [ElectronicInvoicingService],
  exports: [ElectronicInvoicingService],
})
export class ElectronicInvoicingModule {}

