import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Recipe, RecipeItem } from './entities/recipe.entity';
import {
  ProductionOrder,
  ProductionInput,
  ProductionOutput,
} from './entities/production-order.entity';
import { Product } from '../inventory/entities/product.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Branch } from '../inventory/entities/branch.entity';

import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recipe,
      RecipeItem,
      ProductionOrder,
      ProductionInput,
      ProductionOutput,
      Product,
      Inventory,
      Branch,
    ]),
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
