import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { Inventory } from './entities/inventory.entity';
import { Branch } from './entities/branch.entity';
import { Unit } from './entities/unit.entity';
import { Category } from './entities/category.entity';
import { PriceList } from './entities/price-list.entity';
import { ProductPrice } from './entities/product-price.entity';
import { Brand } from './entities/brand.entity';

import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryListener } from './inventory.listener';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Inventory,
      Branch,
      Unit,
      Category,
      PriceList,
      ProductPrice,
      Brand,
    ]),
    NotificationsModule, // Para poder inyectar NotificationsGateway en InventoryListener
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix = uuidv4();
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryListener],
  exports: [InventoryService], // SalesModule lo importará para descontar stock
})
export class InventoryModule {}
