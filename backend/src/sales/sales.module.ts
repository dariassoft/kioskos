import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CashRegister } from './entities/cash-register.entity';
import { Customer } from './entities/customer.entity';
import { PaymentAccount } from './entities/payment-account.entity';
import { Branch } from '../inventory/entities/branch.entity';

import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';

import { InventoryModule } from '../inventory/inventory.module'; // Importante para rebajar stock!

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, CashRegister, Customer, Branch, PaymentAccount]),
    InventoryModule, // Inyectamos InventoryService desde su módulo
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          cb(null, `voucher-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
