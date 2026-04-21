import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Product } from './entities/product.entity';
import { Inventory } from './entities/inventory.entity';
import { Branch } from './entities/branch.entity';
import { Unit } from './entities/unit.entity';
import { Category } from './entities/category.entity';
import { PriceList } from './entities/price-list.entity';
import { ProductPrice } from './entities/product-price.entity';
import { Brand } from './entities/brand.entity';
import { StockReducedEvent } from './events/stock-reduced.event';

import {
  CreateProductDto,
  UpdateProductDto,
  SetPriceDto,
  UpdateStockDto,
  CreateBranchDto,
  CreateCategoryDto,
  CreateUnitDto,
  ProductQueryDto,
  BulkUpdatePriceDto,
  PriceAdjustmentType,
  CreateBrandDto,
  TransferStockDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
    @InjectRepository(PriceList)
    private readonly priceListRepo: Repository<PriceList>,
    @InjectRepository(ProductPrice)
    private readonly productPriceRepo: Repository<ProductPrice>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================
  // PRODUCTOS
  // ==========================================

  async findAllProducts(tenantId: string, query: ProductQueryDto) {
    const { search, category_id, page = 1, limit = 25 } = query;
    const skip = (page - 1) * limit;

    const qb = this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.unit', 'unit')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.prices', 'prices')
      .leftJoinAndSelect('prices.price_list', 'price_list')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.is_active = :active', { active: true });

    if (search) {
      qb.andWhere(
        '(p.name LIKE :search OR p.barcode LIKE :search OR p.internal_code LIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (category_id) {
      qb.andWhere('p.category_id = :category_id', { category_id });
    }

    const [data, total] = await qb
      .orderBy('p.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOneProduct(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['unit', 'category', 'prices', 'prices.price_list'],
    });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  async createProduct(dto: CreateProductDto, tenantId: string): Promise<Product> {
    const { sale_price, sale_margin, ...productData } = dto;

    if (dto.barcode) {
      const existing = await this.productRepo.findOne({
        where: { barcode: dto.barcode, tenant_id: tenantId },
      });
      if (existing) {
        throw new ConflictException(`Ya existe un producto con el código de barras: ${dto.barcode}`);
      }
    }
    // Limpiar strings vacíos de relaciones opcionales (evita errores de UUID en DB)
    const cleanedData: any = { ...productData };
    ['unit_id', 'category_id', 'brand_id', 'supplier_id'].forEach(key => {
      if (cleanedData[key] === '') cleanedData[key] = null;
    });

    const productEntity = this.productRepo.create({ ...cleanedData, tenant_id: tenantId } as Partial<Product>);
    const savedProduct: Product = await this.productRepo.save(productEntity as any);

    // Si se envió precio de venta o margen, asignar a la lista de precios DEFAULT
    let finalPrice = Number(sale_price || 0);
    
    // Si no hay precio explícito pero sí un margen y costo, calculamos
    if (!finalPrice && sale_margin && dto.cost_price) {
      finalPrice = Number(dto.cost_price) * (1 + Number(sale_margin) / 100);
    }

    if (finalPrice > 0) {
      const defaultList = await this.priceListRepo.findOne({
        where: { tenant_id: tenantId, is_default: true }
      });

      if (defaultList) {
        await this.setProductPrice(savedProduct.id, {
          price_list_id: defaultList.id,
          price: finalPrice
        }, tenantId);
      }
    }

    return this.findOneProduct(savedProduct.id, tenantId);
  }

  async updateProduct(id: string, dto: UpdateProductDto, tenantId: string): Promise<Product> {
    await this.findOneProduct(id, tenantId);
    const cleanedDto: any = { ...dto };
    ['unit_id', 'category_id', 'brand_id', 'supplier_id'].forEach(key => {
      if (cleanedDto[key] === '') cleanedDto[key] = null;
    });

    await this.productRepo.update({ id, tenant_id: tenantId }, cleanedDto as any);
    return this.findOneProduct(id, tenantId);
  }

  async deleteProduct(id: string, tenantId: string): Promise<void> {
    await this.findOneProduct(id, tenantId);
    await this.productRepo.update({ id, tenant_id: tenantId }, { is_active: false });
  }

  // ==========================================
  // PRECIOS
  // ==========================================

  async setProductPrice(productId: string, dto: SetPriceDto, tenantId: string): Promise<ProductPrice> {
    await this.findOneProduct(productId, tenantId);
    
    // Validar propiedad de la lista de precios
    const priceList = await this.priceListRepo.findOne({
      where: { id: dto.price_list_id, tenant_id: tenantId }
    });
    if (!priceList) throw new NotFoundException('Lista de precios no encontrada');

    const existing = await this.productPriceRepo.findOne({
      where: { product_id: productId, price_list_id: dto.price_list_id },
    });
    if (existing) {
      await this.productPriceRepo.update(existing.id, { price: dto.price });
      return this.productPriceRepo.findOne({ where: { id: existing.id } }) as Promise<ProductPrice>;
    }
    const pp = this.productPriceRepo.create({ ...dto, product_id: productId });
    return this.productPriceRepo.save(pp);
  }

  async bulkUpdatePrices(dto: BulkUpdatePriceDto, tenantId: string) {
    const { category_id, supplier_id, brand_id, adjustment_type, value, price_list_id } = dto;

    // 1. Obtener la lista de precios a afectar
    let targetListId = price_list_id;
    if (!targetListId) {
      const defaultList = await this.priceListRepo.findOne({ where: { tenant_id: tenantId, is_default: true } });
      if (!defaultList) throw new NotFoundException('No se encontró una lista de precios por defecto');
      targetListId = defaultList.id;
    }

    // 2. Construir la consulta de productos a actualizar
    const qb = this.productRepo.createQueryBuilder('p')
      .select('p.id')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.is_active = :active', { active: true });

    if (category_id) qb.andWhere('p.category_id = :category_id', { category_id });
    if (supplier_id) qb.andWhere('p.supplier_id = :supplier_id', { supplier_id });
    if (brand_id) qb.andWhere('p.brand_id = :brand_id', { brand_id });

    const products = await qb.getMany();
    if (products.length === 0) return { updated: 0 };

    const productIds = products.map(p => p.id);

    // 3. Aplicar el ajuste a cada precio
    // Nota: Por simplicidad lo hacemos en una transacción o bucle, 
    // pero para escalas masivas sería mejor un SQL nativo con CASE o JOIN.
    let count = 0;
    for (const pid of productIds) {
      let priceEntry = await this.productPriceRepo.findOne({
        where: { product_id: pid, price_list_id: targetListId }
      });

      if (!priceEntry) {
        // Si no tiene precio en esa lista, podríamos ignorarlo o crear uno base 0
        continue;
      }

      let newPrice = Number(priceEntry.price);
      if (adjustment_type === PriceAdjustmentType.PERCENTAGE) {
        newPrice = newPrice * (1 + (value / 100));
      } else {
        newPrice = newPrice + value;
      }

      await this.productPriceRepo.update(priceEntry.id, { price: Math.max(0, newPrice) });
      count++;
    }

    return { updated: count };
  }

  // ==========================================
  // STOCK MULTISUCURSAL
  // ==========================================

  async getInventoryByBranch(tenantId: string, branchId: string) {
    return this.inventoryRepo.find({
      where: { tenant_id: tenantId, branch_id: branchId },
      relations: ['product', 'branch'],
      order: { product: { name: 'ASC' } as any },
    });
  }

  async getLowStockItems(tenantId: string) {
    return this.inventoryRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.product', 'product')
      .leftJoinAndSelect('inv.branch', 'branch')
      .where('inv.tenant_id = :tenantId', { tenantId })
      .andWhere('inv.stock_quantity <= inv.min_stock_alert')
      .orderBy('inv.stock_quantity', 'ASC')
      .getMany();
  }

  async addStock(dto: UpdateStockDto, productId: string, tenantId: string): Promise<Inventory> {
    // Validar propiedad del producto y sucursal
    await this.findOneProduct(productId, tenantId);
    await this.findOneBranch(dto.branch_id, tenantId);

    let inv = await this.inventoryRepo.findOne({
      where: { product_id: productId, branch_id: dto.branch_id, tenant_id: tenantId },
    });

    if (!inv) {
      inv = this.inventoryRepo.create({
        tenant_id: tenantId,
        product_id: productId,
        branch_id: dto.branch_id,
        stock_quantity: 0,
        min_stock_alert: dto.min_stock_alert ?? 5,
      });
      await this.inventoryRepo.save(inv);
    }

    await this.inventoryRepo.update(inv.id, {
      stock_quantity: Number(inv.stock_quantity) + Number(dto.quantity),
      last_restock_date: new Date(),
      ...(dto.min_stock_alert !== undefined && { min_stock_alert: dto.min_stock_alert }),
    });

    return this.inventoryRepo.findOne({
      where: { id: inv.id },
      relations: ['product', 'branch'],
    }) as Promise<Inventory>;
  }

  async reduceStock(
    productId: string,
    branchId: string,
    quantity: number,
    tenantId: string,
  ): Promise<Inventory> {
    const inv = await this.inventoryRepo.findOne({
      where: { product_id: productId, branch_id: branchId, tenant_id: tenantId },
      relations: ['product'],
    });

    if (!inv) throw new NotFoundException(`Stock no encontrado para producto ${productId}`);

    const newQty = Number(inv.stock_quantity) - Number(quantity);
    if (newQty < 0) {
      throw new BadRequestException(
        `Stock insuficiente: disponible ${inv.stock_quantity}, solicitado ${quantity}`,
      );
    }

    await this.inventoryRepo.update(inv.id, { stock_quantity: newQty });

    this.eventEmitter.emit(
      'stock.reduced',
      new StockReducedEvent(tenantId, productId, branchId, newQty, inv.product?.name ?? ''),
    );

    return { ...inv, stock_quantity: newQty };
  }

  async adjustStock(
    dto: { product_id: string; branch_id: string; quantity: number; reason: string },
    tenantId: string,
  ): Promise<Inventory> {
    const inv = await this.inventoryRepo.findOne({
      where: { product_id: dto.product_id, branch_id: dto.branch_id, tenant_id: tenantId },
      relations: ['product'],
    });

    if (!inv) throw new NotFoundException('Inventario no encontrado para este producto/sucursal');

    const newQty = Number(inv.stock_quantity) - Number(dto.quantity);
    if (newQty < 0) throw new BadRequestException('El ajuste resultaría en stock negativo');

    await this.inventoryRepo.update(inv.id, { stock_quantity: newQty });

    // Emitir evento para auditoría y posible asiento contable
    this.eventEmitter.emit('stock.adjusted', {
      tenantId,
      productId: dto.product_id,
      branchId: dto.branch_id,
      quantity: dto.quantity,
      reason: dto.reason,
      newQuantity: newQty,
    });

    return { ...inv, stock_quantity: newQty };
  }

  async transferStock(dto: TransferStockDto, tenantId: string) {
    const { product_id, from_branch_id, to_branch_id, quantity } = dto;

    if (from_branch_id === to_branch_id) {
      throw new BadRequestException('La sucursal de origen y destino no pueden ser la misma');
    }

    return this.inventoryRepo.manager.transaction(async (manager) => {
      const sourceInv = await manager.findOne(Inventory, {
        where: { product_id, branch_id: from_branch_id, tenant_id: tenantId },
        relations: ['product'],
      });

      if (!sourceInv) throw new NotFoundException('Producto no encontrado en la sucursal de origen');

      const currentSourceQty = Number(sourceInv.stock_quantity);
      if (currentSourceQty < quantity) {
        throw new BadRequestException(
          `Stock insuficiente en origen: disponible ${currentSourceQty}, solicitado ${quantity}`,
        );
      }

      await manager.update(Inventory, sourceInv.id, {
        stock_quantity: currentSourceQty - Number(quantity),
      });

      let targetInv = await manager.findOne(Inventory, {
        where: { product_id, branch_id: to_branch_id, tenant_id: tenantId },
      });

      if (!targetInv) {
        targetInv = manager.create(Inventory, {
          product_id,
          branch_id: to_branch_id,
          tenant_id: tenantId,
          stock_quantity: 0,
          min_stock_alert: sourceInv.min_stock_alert,
        });
        await manager.save(targetInv);
      }

      await manager.update(Inventory, targetInv.id, {
        stock_quantity: Number(targetInv.stock_quantity) + Number(quantity),
        last_restock_date: new Date(),
      });

      this.eventEmitter.emit('stock.transferred', {
        tenantId,
        productId: product_id,
        fromBranchId: from_branch_id,
        toBranchId: to_branch_id,
        quantity,
        productName: sourceInv.product?.name ?? 'Producto',
      });

      return { success: true, transferred: quantity };
    });
  }

  async getReplenishmentList(tenantId: string, branchId?: string) {
    const qb = this.inventoryRepo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.product', 'product')
      .leftJoinAndSelect('inv.branch', 'branch')
      .where('inv.tenant_id = :tenantId', { tenantId });

    if (branchId) {
      qb.andWhere('inv.branch_id = :branchId', { branchId });
    }

    // Un producto necesita reposición si su cantidad es <= a su alerta de stock mínimo
    qb.andWhere('inv.stock_quantity <= inv.min_stock_alert')
      .orderBy('inv.stock_quantity', 'ASC');

    return qb.getMany();
  }

  // ==========================================
  // SUCURSALES
  // ==========================================

  async findAllBranches(tenantId: string): Promise<Branch[]> {
    return this.branchRepo.find({
      where: { tenant_id: tenantId },
      order: { is_main_branch: 'DESC', name: 'ASC' },
    });
  }

  async createBranch(dto: CreateBranchDto, tenantId: string): Promise<Branch> {
    const branch = this.branchRepo.create({ ...dto, tenant_id: tenantId });
    return this.branchRepo.save(branch);
  }

  async updateBranch(id: string, dto: Partial<CreateBranchDto>, tenantId: string): Promise<Branch> {
    await this.branchRepo.update({ id, tenant_id: tenantId }, dto as any);
    return this.findOneBranch(id, tenantId);
  }

  async findOneBranch(id: string, tenantId: string): Promise<Branch> {
    const branch = await this.branchRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!branch) throw new NotFoundException(`Sucursal ${id} no encontrada`);
    return branch;
  }

  // ==========================================
  // CATEGORÍAS
  // ==========================================

  async findAllCategories(tenantId: string): Promise<Category[]> {
    return this.categoryRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async createCategory(dto: CreateCategoryDto, tenantId: string): Promise<Category> {
    const cat = this.categoryRepo.create({ ...dto, tenant_id: tenantId });
    return this.categoryRepo.save(cat);
  }

  // ==========================================
  // MARCAS
  // ==========================================

  async findAllBrands(tenantId: string): Promise<Brand[]> {
    return this.brandRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async createBrand(dto: CreateBrandDto, tenantId: string): Promise<Brand> {
    const brand = this.brandRepo.create({ ...dto, tenant_id: tenantId });
    return this.brandRepo.save(brand);
  }

  // ==========================================
  // UNIDADES DE MEDIDA
  // ==========================================

  async findAllUnits(tenantId: string): Promise<Unit[]> {
    return this.unitRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async createUnit(dto: CreateUnitDto, tenantId: string): Promise<Unit> {
    const unit = this.unitRepo.create({ ...dto, tenant_id: tenantId });
    return this.unitRepo.save(unit);
  }

  // ==========================================
  // LISTAS DE PRECIOS
  // ==========================================

  async findAllPriceLists(tenantId: string): Promise<PriceList[]> {
    return this.priceListRepo.find({ where: { tenant_id: tenantId } });
  }

  async createPriceList(name: string, tenantId: string, isDefault = false): Promise<PriceList> {
    const pl = this.priceListRepo.create({ name, is_default: isDefault, tenant_id: tenantId });
    return this.priceListRepo.save(pl);
  }

  // ==========================================
  // BÚSQUEDA RÁPIDA (POS)
  // ==========================================

  async quickSearch(query: string, tenantId: string, branchId?: string) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.prices', 'prices')
      .leftJoinAndSelect('prices.price_list', 'pl', 'pl.is_default = :def', { def: true })
      .leftJoinAndSelect('p.unit', 'unit')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.is_active = :active', { active: true })
      .andWhere(
        '(p.name LIKE :q OR p.barcode = :exact OR p.internal_code LIKE :q)',
        { q: `%${query}%`, exact: query },
      );

    if (branchId) {
      qb.leftJoinAndMapOne('p.inventory', Inventory, 'inv', 'inv.product_id = p.id AND inv.branch_id = :branchId', { branchId });
    }

    return qb.limit(20).getMany();
  }
}
