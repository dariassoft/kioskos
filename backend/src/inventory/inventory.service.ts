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
    if (dto.barcode) {
      const existing = await this.productRepo.findOne({
        where: { barcode: dto.barcode, tenant_id: tenantId },
      });
      if (existing) {
        throw new ConflictException(`Ya existe un producto con el código de barras: ${dto.barcode}`);
      }
    }
    const product = this.productRepo.create({ ...dto, tenant_id: tenantId });
    return this.productRepo.save(product);
  }

  async updateProduct(id: string, dto: UpdateProductDto, tenantId: string): Promise<Product> {
    await this.findOneProduct(id, tenantId);
    await this.productRepo.update({ id, tenant_id: tenantId }, dto as any);
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
    const updated = await this.branchRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!updated) throw new NotFoundException(`Sucursal ${id} no encontrada`);
    return updated;
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

  async quickSearch(query: string, tenantId: string) {
    return this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.prices', 'prices')
      .leftJoinAndSelect('prices.price_list', 'pl', 'pl.is_default = :def', { def: true })
      .leftJoinAndSelect('p.unit', 'unit')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.is_active = :active', { active: true })
      .andWhere(
        '(p.name LIKE :q OR p.barcode = :exact OR p.internal_code LIKE :q)',
        { q: `%${query}%`, exact: query },
      )
      .limit(20)
      .getMany();
  }
}
