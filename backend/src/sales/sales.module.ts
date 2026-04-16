import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CashRegister } from './entities/cash-register.entity';
import { Customer } from './entities/customer.entity';
import { Branch } from '../inventory/entities/branch.entity';

import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';

import { InventoryModule } from '../inventory/inventory.module'; // Importante para rebajar stock!

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, CashRegister, Customer, Branch]),
    InventoryModule, // Inyectamos InventoryService desde su módulo
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
