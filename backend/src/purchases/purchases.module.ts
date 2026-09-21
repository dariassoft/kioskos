import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchasePayment } from './entities/purchase-payment.entity';

import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';

import { InventoryModule } from '../inventory/inventory.module'; // Importante para incrementar stock!

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, PurchaseOrder, PurchaseOrderItem, PurchasePayment]),
    InventoryModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService], // Se exporta por si Accounting lo necesita a futuro
})
export class PurchasesModule {}
