import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AfipCredentials } from './entities/afip-credentials.entity';
import { ElectronicInvoice } from './entities/electronic-invoice.entity';
import { Sale } from '../sales/entities/sale.entity';
import { ElectronicInvoicingService } from './electronic-invoicing.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { ElectronicInvoicingController } from './electronic-invoicing.controller';

// BillingModule exporta BillingService para validar features por plan
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AfipCredentials, ElectronicInvoice, Sale]),
    BillingModule, // Necesario para BillingService.isFeatureEnabled()
  ],
  controllers: [ElectronicInvoicingController],
  providers: [ElectronicInvoicingService, InvoicePdfService],
  exports: [ElectronicInvoicingService, InvoicePdfService],
})
export class ElectronicInvoicingModule {}

