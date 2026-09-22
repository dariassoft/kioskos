import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Recipe, RecipeItem, RecipeType } from './entities/recipe.entity';
import {
  ProductionOrder,
  ProductionInput,
  ProductionOutput,
  ProductionStatus,
} from './entities/production-order.entity';
import { Product, ProductType } from '../inventory/entities/product.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Branch } from '../inventory/entities/branch.entity';
import { StockReducedEvent } from '../inventory/events/stock-reduced.event';
import { ProductionCompletedEvent } from './events/production-completed.event';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  CreateProductionOrderDto,
} from './dto/production.dto';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,
    @InjectRepository(RecipeItem)
    private readonly recipeItemRepo: Repository<RecipeItem>,
    @InjectRepository(ProductionOrder)
    private readonly orderRepo: Repository<ProductionOrder>,
    @InjectRepository(ProductionInput)
    private readonly inputRepo: Repository<ProductionInput>,
    @InjectRepository(ProductionOutput)
    private readonly outputRepo: Repository<ProductionOutput>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================
  // RECETAS
  // ==========================================

  async findAllRecipes(tenantId: string): Promise<Recipe[]> {
    return this.recipeRepo.createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.output_product', 'outputProduct', 'outputProduct.tenant_id = :tenantId')
      .leftJoinAndSelect('recipe.items', 'items')
      .leftJoinAndSelect('items.product', 'itemProduct', 'itemProduct.tenant_id = :tenantId')
      .where('recipe.tenant_id = :tenantId AND recipe.is_active = :active', { tenantId, active: true })
      .orderBy('recipe.name', 'ASC')
      .getMany();
  }

  async findOneRecipe(id: string, tenantId: string): Promise<Recipe> {
    const recipe = await this.recipeRepo.createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.output_product', 'outputProduct', 'outputProduct.tenant_id = :tenantId')
      .leftJoinAndSelect('recipe.items', 'items')
      .leftJoinAndSelect('items.product', 'itemProduct', 'itemProduct.tenant_id = :tenantId')
      .where('recipe.id = :id AND recipe.tenant_id = :tenantId', { id, tenantId })
      .getOne();
    if (!recipe) throw new NotFoundException(`Receta ${id} no encontrada`);
    return recipe;
  }

  async createRecipe(dto: CreateRecipeDto, tenantId: string): Promise<Recipe> {
    const outputProduct = await this.validateProduct(dto.output_product_id, tenantId);
    for (const item of dto.items) {
      if (item.product_id === dto.output_product_id) {
        throw new BadRequestException('Un producto no puede ser insumo y resultado de la misma receta');
      }
      await this.validateProduct(item.product_id, tenantId);
    }

    // Marcar el producto de salida según el tipo de receta (no rompe nada: standard sigue igual)
    const derivedType = dto.type === RecipeType.FRACTIONING
      ? ProductType.FRACTIONATED
      : ProductType.ELABORATED;
    if (outputProduct.product_type === ProductType.STANDARD) {
      await this.productRepo.update({ id: outputProduct.id, tenant_id: tenantId }, { product_type: derivedType });
    }

    const recipe = this.recipeRepo.create({
      name: dto.name,
      type: dto.type,
      output_product_id: dto.output_product_id,
      output_quantity: dto.output_quantity,
      notes: dto.notes,
      tenant_id: tenantId,
    });
    await this.recipeRepo.save(recipe);
    await this.recipeItemRepo.save(
      dto.items.map((i) => this.recipeItemRepo.create({ ...i, recipe_id: recipe.id })),
    );
    return this.findOneRecipe(recipe.id, tenantId);
  }

  async updateRecipe(id: string, dto: UpdateRecipeDto, tenantId: string): Promise<Recipe> {
    const recipe = await this.findOneRecipe(id, tenantId);
    if (dto.output_product_id) await this.validateProduct(dto.output_product_id, tenantId);

    const { items, ...data } = dto;
    await this.recipeRepo.update({ id, tenant_id: tenantId }, data as any);

    if (items) {
      for (const item of items) await this.validateProduct(item.product_id, tenantId);
      await this.recipeItemRepo.delete({ recipe_id: id });
      await this.recipeItemRepo.save(
        items.map((i) => this.recipeItemRepo.create({ ...i, recipe_id: id })),
      );
    }
    return this.findOneRecipe(recipe.id, tenantId);
  }

  async deleteRecipe(id: string, tenantId: string): Promise<void> {
    await this.findOneRecipe(id, tenantId);
    await this.recipeRepo.update({ id, tenant_id: tenantId }, { is_active: false });
  }

  /**
   * Seguimiento CALCULADO: dado un producto elaborado/fraccionado y una cantidad
   * deseada, estima cuánto insumo se necesita según la receta.
   */
  async calculateRequirements(outputProductId: string, desiredQuantity: number, tenantId: string) {
    const recipe = await this.recipeRepo.findOne({
      where: { output_product_id: outputProductId, tenant_id: tenantId, is_active: true },
    });
    if (!recipe) {
      throw new NotFoundException('No hay una receta activa para este producto');
    }

    const factor = desiredQuantity / Number(recipe.output_quantity);
    return {
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      output_product_id: recipe.output_product_id,
      desired_quantity: desiredQuantity,
      batches: factor,
      estimated_inputs: recipe.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product?.name,
        estimated_quantity: Number(item.quantity) * factor,
      })),
    };
  }

  // ==========================================
  // ÓRDENES DE PRODUCCIÓN
  // ==========================================

  async findAllOrders(tenantId: string, branchId?: string): Promise<ProductionOrder[]> {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.inputs', 'inputs')
      .leftJoinAndSelect('inputs.product', 'inputProduct', 'inputProduct.tenant_id = :tenantId')
      .leftJoinAndSelect('o.outputs', 'outputs')
      .leftJoinAndSelect('outputs.product', 'outputProduct', 'outputProduct.tenant_id = :tenantId')
      .leftJoinAndSelect('o.recipe', 'recipe')
      .where('o.tenant_id = :tenantId', { tenantId })
      .orderBy('o.created_at', 'DESC');

    if (branchId) qb.andWhere('o.branch_id = :branchId', { branchId });
    return qb.getMany();
  }

  async findOneOrder(id: string, tenantId: string): Promise<ProductionOrder> {
    const order = await this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.inputs', 'inputs')
      .leftJoinAndSelect('inputs.product', 'inputProduct', 'inputProduct.tenant_id = :tenantId')
      .leftJoinAndSelect('order.outputs', 'outputs')
      .leftJoinAndSelect('outputs.product', 'outputProduct', 'outputProduct.tenant_id = :tenantId')
      .leftJoinAndSelect('order.recipe', 'recipe', 'recipe.tenant_id = :tenantId')
      .where('order.id = :id AND order.tenant_id = :tenantId', { id, tenantId })
      .getOne();
    if (!order) throw new NotFoundException(`Orden de producción ${id} no encontrada`);
    return order;
  }

  /**
   * Registra una producción (fraccionamiento o elaboración) en UNA transacción:
   *  - Descuenta stock de insumos (permite negativo: el seguimiento de materias
   *    primas es APROXIMADO/calculado, no bloqueante).
   *  - Incrementa stock de los productos obtenidos.
   *  - Prorratea el costo de insumos a los outputs y actualiza su cost_price.
   */
  async createOrder(dto: CreateProductionOrderDto, tenantId: string, userId?: string) {
    const branch = await this.branchRepo.findOne({ where: { id: dto.branch_id, tenant_id: tenantId } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    if (dto.recipe_id) await this.findOneRecipe(dto.recipe_id, tenantId);

    const inputProducts: Product[] = [];
    for (const input of dto.inputs) inputProducts.push(await this.validateProduct(input.product_id, tenantId));
    const outputProducts: Product[] = [];
    for (const output of dto.outputs) outputProducts.push(await this.validateProduct(output.product_id, tenantId));

    const inputIds = dto.inputs.map((i) => i.product_id);
    for (const out of dto.outputs) {
      if (inputIds.includes(out.product_id)) {
        throw new BadRequestException('Un producto no puede ser insumo y resultado en la misma orden');
      }
    }

    const warnings: string[] = [];

    const order = await this.orderRepo.manager.transaction(async (manager) => {
      // Costos de insumos desde cost_price actual
      const inputLines = dto.inputs.map((input, idx) => {
        const unitCost = Number(inputProducts[idx].cost_price || 0);
        return { ...input, unit_cost: unitCost, subtotal: unitCost * Number(input.quantity) };
      });
      const totalInputCost = inputLines.reduce((sum, l) => sum + l.subtotal, 0);

      // Prorrateo del costo a los outputs (por cantidad) salvo unit_cost manual
      const totalOutputQty = dto.outputs.reduce((sum, o) => sum + Number(o.quantity), 0);
      const outputLines = dto.outputs.map((output) => {
        const unitCost = output.unit_cost !== undefined
          ? Number(output.unit_cost)
          : totalOutputQty > 0 ? totalInputCost / totalOutputQty : 0;
        return { ...output, unit_cost: unitCost, subtotal: unitCost * Number(output.quantity) };
      });

      // 1. Descontar insumos (segumiento aproximado: no bloquea si queda negativo)
      for (const line of inputLines) {
        let inv = await manager.findOne(Inventory, {
          where: { product_id: line.product_id, branch_id: dto.branch_id, tenant_id: tenantId },
        });
        if (!inv) {
          inv = manager.create(Inventory, {
            tenant_id: tenantId,
            product_id: line.product_id,
            branch_id: dto.branch_id,
            stock_quantity: 0,
          });
          await manager.save(inv);
        }
        const newQty = Number(inv.stock_quantity) - Number(line.quantity);
        await manager.update(Inventory, inv.id, { stock_quantity: newQty });
        if (newQty < 0) {
          const p = inputProducts.find((pr) => pr.id === line.product_id);
          warnings.push(`Stock de "${p?.name}" quedó en ${newQty} (seguimiento aproximado)`);
        }
      }

      // 2. Incrementar productos obtenidos + actualizar costo
      for (const line of outputLines) {
        let inv = await manager.findOne(Inventory, {
          where: { product_id: line.product_id, branch_id: dto.branch_id, tenant_id: tenantId },
        });
        if (!inv) {
          inv = manager.create(Inventory, {
            tenant_id: tenantId,
            product_id: line.product_id,
            branch_id: dto.branch_id,
            stock_quantity: 0,
          });
          await manager.save(inv);
        }
        await manager.update(Inventory, { id: inv.id, tenant_id: tenantId }, {
          stock_quantity: Number(inv.stock_quantity) + Number(line.quantity),
          last_restock_date: new Date(),
        });
        if (line.unit_cost > 0) {
          await manager.update(Product, { id: line.product_id, tenant_id: tenantId }, { cost_price: line.unit_cost });
        }
      }

      // 3. Persistir la orden con sus líneas
      const newOrder = manager.create(ProductionOrder, {
        tenant_id: tenantId,
        branch_id: dto.branch_id,
        recipe_id: dto.recipe_id ?? null,
        user_id: userId ?? null,
        status: ProductionStatus.COMPLETED,
        total_input_cost: totalInputCost,
        notes: dto.notes,
      });
      await manager.save(newOrder);

      await manager.save(
        inputLines.map((l) => manager.create(ProductionInput, {
          production_order_id: newOrder.id,
          product_id: l.product_id,
          quantity: l.quantity,
          unit_cost: l.unit_cost,
          subtotal: l.subtotal,
        })),
      );
      await manager.save(
        outputLines.map((l) => manager.create(ProductionOutput, {
          production_order_id: newOrder.id,
          product_id: l.product_id,
          quantity: l.quantity,
          unit_cost: l.unit_cost,
          subtotal: l.subtotal,
        })),
      );

      return newOrder;
    });

    // Eventos fuera de la transacción
    for (const input of dto.inputs) {
      const inv = await this.inventoryRepo.findOne({
        where: { product_id: input.product_id, branch_id: dto.branch_id, tenant_id: tenantId },
        relations: ['product'],
      });
      this.eventEmitter.emit(
        'stock.reduced',
        new StockReducedEvent(tenantId, input.product_id, dto.branch_id, Number(inv?.stock_quantity ?? 0), inv?.product?.name ?? ''),
      );
    }
    this.eventEmitter.emit(
      'production.completed',
      new ProductionCompletedEvent(tenantId, order.id, dto.branch_id, Number(order.total_input_cost)),
    );

    return { order: await this.findOneOrder(order.id, tenantId), warnings };
  }

  /** Cancela una orden: revierte el stock (insumos vuelven, outputs se descuentan). */
  async cancelOrder(id: string, tenantId: string) {
    const order = await this.findOneOrder(id, tenantId);
    if (order.status === ProductionStatus.CANCELLED) {
      throw new BadRequestException('La orden ya está cancelada');
    }

    await this.orderRepo.manager.transaction(async (manager) => {
      for (const input of order.inputs) {
        const inv = await manager.findOne(Inventory, {
          where: { product_id: input.product_id, branch_id: order.branch_id, tenant_id: tenantId },
        });
        if (inv) {
          await manager.update(Inventory, { id: inv.id, tenant_id: tenantId }, {
            stock_quantity: Number(inv.stock_quantity) + Number(input.quantity),
          });
        }
      }
      for (const output of order.outputs) {
        const inv = await manager.findOne(Inventory, {
          where: { product_id: output.product_id, branch_id: order.branch_id, tenant_id: tenantId },
        });
        if (inv) {
          const newQty = Number(inv.stock_quantity) - Number(output.quantity);
          if (newQty < 0) {
            throw new BadRequestException(
              `No se puede cancelar: "${output.product?.name}" ya vendió/consumió el stock producido`,
            );
          }
          await manager.update(Inventory, { id: inv.id, tenant_id: tenantId }, { stock_quantity: newQty });
        }
      }
      await manager.update(ProductionOrder, { id, tenant_id: tenantId }, {
        status: ProductionStatus.CANCELLED,
        cancelled_at: new Date(),
      });
    });

    return this.findOneOrder(id, tenantId);
  }

  private async validateProduct(productId: string, tenantId: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id: productId, tenant_id: tenantId } });
    if (!product) throw new NotFoundException(`Producto ${productId} no encontrado`);
    return product;
  }
}
