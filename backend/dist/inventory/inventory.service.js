"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const product_entity_1 = require("./entities/product.entity");
const inventory_entity_1 = require("./entities/inventory.entity");
const branch_entity_1 = require("./entities/branch.entity");
const unit_entity_1 = require("./entities/unit.entity");
const category_entity_1 = require("./entities/category.entity");
const price_list_entity_1 = require("./entities/price-list.entity");
const product_price_entity_1 = require("./entities/product-price.entity");
const brand_entity_1 = require("./entities/brand.entity");
const stock_reduced_event_1 = require("./events/stock-reduced.event");
const inventory_dto_1 = require("./dto/inventory.dto");
let InventoryService = class InventoryService {
    constructor(productRepo, inventoryRepo, branchRepo, unitRepo, categoryRepo, brandRepo, priceListRepo, productPriceRepo, eventEmitter) {
        this.productRepo = productRepo;
        this.inventoryRepo = inventoryRepo;
        this.branchRepo = branchRepo;
        this.unitRepo = unitRepo;
        this.categoryRepo = categoryRepo;
        this.brandRepo = brandRepo;
        this.priceListRepo = priceListRepo;
        this.productPriceRepo = productPriceRepo;
        this.eventEmitter = eventEmitter;
    }
    async findAllProducts(tenantId, query) {
        const { search, category_id, product_type, page = 1, limit = 25 } = query;
        const skip = (page - 1) * limit;
        const qb = this.productRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.unit', 'unit')
            .leftJoinAndSelect('p.category', 'category')
            .leftJoinAndSelect('p.prices', 'prices')
            .leftJoinAndSelect('prices.price_list', 'price_list')
            .where('p.tenant_id = :tenantId', { tenantId })
            .andWhere('p.is_active = :active', { active: true });
        if (search) {
            qb.andWhere('(p.name LIKE :search OR p.barcode LIKE :search OR p.internal_code LIKE :search)', { search: `%${search}%` });
        }
        if (category_id) {
            qb.andWhere('p.category_id = :category_id', { category_id });
        }
        if (product_type) {
            qb.andWhere('p.product_type = :product_type', { product_type });
        }
        const [data, total] = await qb
            .orderBy('p.name', 'ASC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return { data, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async findOneProduct(id, tenantId) {
        const product = await this.productRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['unit', 'category', 'prices', 'prices.price_list'],
        });
        if (!product)
            throw new common_1.NotFoundException(`Producto ${id} no encontrado`);
        return product;
    }
    async createProduct(dto, tenantId) {
        const { sale_price, sale_margin, ...productData } = dto;
        if (dto.barcode) {
            const existing = await this.productRepo.findOne({
                where: { barcode: dto.barcode, tenant_id: tenantId },
            });
            if (existing) {
                throw new common_1.ConflictException(`Ya existe un producto con el código de barras: ${dto.barcode}`);
            }
        }
        const cleanedData = { ...productData };
        ['unit_id', 'category_id', 'brand_id', 'supplier_id'].forEach(key => {
            if (cleanedData[key] === '')
                cleanedData[key] = null;
        });
        const productEntity = this.productRepo.create({ ...cleanedData, tenant_id: tenantId });
        const savedProduct = await this.productRepo.save(productEntity);
        let finalPrice = Number(sale_price || 0);
        if (!finalPrice && sale_margin !== undefined && dto.cost_price !== undefined) {
            const vatRate = Number(dto.vat_rate || 0);
            finalPrice = Number(dto.cost_price) * (1 + Number(sale_margin) / 100) * (1 + vatRate / 100);
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
    async updateProduct(id, dto, tenantId) {
        await this.findOneProduct(id, tenantId);
        const { sale_price, sale_margin, ...productData } = dto;
        const cleanedDto = { ...productData };
        ['unit_id', 'category_id', 'brand_id', 'supplier_id'].forEach(key => {
            if (cleanedDto[key] === '')
                cleanedDto[key] = null;
        });
        await this.productRepo.update({ id, tenant_id: tenantId }, cleanedDto);
        let finalPrice = Number(sale_price || 0);
        if (!finalPrice && sale_margin !== undefined && dto.cost_price !== undefined) {
            const vatRate = Number(dto.vat_rate || 0);
            finalPrice = Number(dto.cost_price) * (1 + Number(sale_margin) / 100) * (1 + vatRate / 100);
        }
        if (finalPrice >= 0 && (sale_price !== undefined || sale_margin !== undefined)) {
            const defaultList = await this.priceListRepo.findOne({
                where: { tenant_id: tenantId, is_default: true },
            });
            if (defaultList) {
                await this.setProductPrice(id, {
                    price_list_id: defaultList.id,
                    price: finalPrice,
                }, tenantId);
            }
        }
        return this.findOneProduct(id, tenantId);
    }
    async deleteProduct(id, tenantId) {
        await this.findOneProduct(id, tenantId);
        await this.productRepo.update({ id, tenant_id: tenantId }, { is_active: false });
    }
    async setProductPrice(productId, dto, tenantId) {
        await this.findOneProduct(productId, tenantId);
        const priceList = await this.priceListRepo.findOne({
            where: { id: dto.price_list_id, tenant_id: tenantId }
        });
        if (!priceList)
            throw new common_1.NotFoundException('Lista de precios no encontrada');
        const existing = await this.productPriceRepo.findOne({
            where: { product_id: productId, price_list_id: dto.price_list_id },
        });
        if (existing) {
            await this.productPriceRepo.update(existing.id, { price: dto.price });
            return this.productPriceRepo.findOne({ where: { id: existing.id } });
        }
        const pp = this.productPriceRepo.create({ ...dto, product_id: productId });
        return this.productPriceRepo.save(pp);
    }
    async bulkUpdatePrices(dto, tenantId) {
        const { category_id, supplier_id, brand_id, adjustment_type, value, price_list_id } = dto;
        let targetListId = price_list_id;
        if (!targetListId) {
            const defaultList = await this.priceListRepo.findOne({ where: { tenant_id: tenantId, is_default: true } });
            if (!defaultList)
                throw new common_1.NotFoundException('No se encontró una lista de precios por defecto');
            targetListId = defaultList.id;
        }
        const qb = this.productRepo.createQueryBuilder('p')
            .select('p.id')
            .where('p.tenant_id = :tenantId', { tenantId })
            .andWhere('p.is_active = :active', { active: true });
        if (category_id)
            qb.andWhere('p.category_id = :category_id', { category_id });
        if (supplier_id)
            qb.andWhere('p.supplier_id = :supplier_id', { supplier_id });
        if (brand_id)
            qb.andWhere('p.brand_id = :brand_id', { brand_id });
        const products = await qb.getMany();
        if (products.length === 0)
            return { updated: 0 };
        const productIds = products.map(p => p.id);
        let count = 0;
        for (const pid of productIds) {
            let priceEntry = await this.productPriceRepo.findOne({
                where: { product_id: pid, price_list_id: targetListId }
            });
            if (!priceEntry) {
                continue;
            }
            let newPrice = Number(priceEntry.price);
            if (adjustment_type === inventory_dto_1.PriceAdjustmentType.PERCENTAGE) {
                newPrice = newPrice * (1 + (value / 100));
            }
            else {
                newPrice = newPrice + value;
            }
            await this.productPriceRepo.update(priceEntry.id, { price: Math.max(0, newPrice) });
            count++;
        }
        return { updated: count };
    }
    async getInventoryByBranch(tenantId, branchId) {
        return this.inventoryRepo.find({
            where: { tenant_id: tenantId, branch_id: branchId },
            relations: ['product', 'branch'],
            order: { product: { name: 'ASC' } },
        });
    }
    async getLowStockItems(tenantId) {
        return this.inventoryRepo
            .createQueryBuilder('inv')
            .leftJoinAndSelect('inv.product', 'product')
            .leftJoinAndSelect('inv.branch', 'branch')
            .where('inv.tenant_id = :tenantId', { tenantId })
            .andWhere('inv.stock_quantity <= inv.min_stock_alert')
            .orderBy('inv.stock_quantity', 'ASC')
            .getMany();
    }
    async addStock(dto, productId, tenantId) {
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
        });
    }
    async reduceStock(productId, branchId, quantity, tenantId) {
        const inv = await this.inventoryRepo.findOne({
            where: { product_id: productId, branch_id: branchId, tenant_id: tenantId },
            relations: ['product'],
        });
        if (!inv)
            throw new common_1.NotFoundException(`Stock no encontrado para producto ${productId}`);
        const newQty = Number(inv.stock_quantity) - Number(quantity);
        if (newQty < 0) {
            throw new common_1.BadRequestException(`Stock insuficiente: disponible ${inv.stock_quantity}, solicitado ${quantity}`);
        }
        await this.inventoryRepo.update(inv.id, { stock_quantity: newQty });
        this.eventEmitter.emit('stock.reduced', new stock_reduced_event_1.StockReducedEvent(tenantId, productId, branchId, newQty, inv.product?.name ?? ''));
        return { ...inv, stock_quantity: newQty };
    }
    async adjustStock(dto, tenantId) {
        const inv = await this.inventoryRepo.findOne({
            where: { product_id: dto.product_id, branch_id: dto.branch_id, tenant_id: tenantId },
            relations: ['product'],
        });
        if (!inv)
            throw new common_1.NotFoundException('Inventario no encontrado para este producto/sucursal');
        const newQty = Number(inv.stock_quantity) - Number(dto.quantity);
        if (newQty < 0)
            throw new common_1.BadRequestException('El ajuste resultaría en stock negativo');
        await this.inventoryRepo.update(inv.id, { stock_quantity: newQty });
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
    async transferStock(dto, tenantId) {
        const { product_id, from_branch_id, to_branch_id, quantity } = dto;
        if (from_branch_id === to_branch_id) {
            throw new common_1.BadRequestException('La sucursal de origen y destino no pueden ser la misma');
        }
        return this.inventoryRepo.manager.transaction(async (manager) => {
            const sourceInv = await manager.findOne(inventory_entity_1.Inventory, {
                where: { product_id, branch_id: from_branch_id, tenant_id: tenantId },
                relations: ['product'],
            });
            if (!sourceInv)
                throw new common_1.NotFoundException('Producto no encontrado en la sucursal de origen');
            const currentSourceQty = Number(sourceInv.stock_quantity);
            if (currentSourceQty < quantity) {
                throw new common_1.BadRequestException(`Stock insuficiente en origen: disponible ${currentSourceQty}, solicitado ${quantity}`);
            }
            await manager.update(inventory_entity_1.Inventory, sourceInv.id, {
                stock_quantity: currentSourceQty - Number(quantity),
            });
            let targetInv = await manager.findOne(inventory_entity_1.Inventory, {
                where: { product_id, branch_id: to_branch_id, tenant_id: tenantId },
            });
            if (!targetInv) {
                targetInv = manager.create(inventory_entity_1.Inventory, {
                    product_id,
                    branch_id: to_branch_id,
                    tenant_id: tenantId,
                    stock_quantity: 0,
                    min_stock_alert: sourceInv.min_stock_alert,
                });
                await manager.save(targetInv);
            }
            await manager.update(inventory_entity_1.Inventory, targetInv.id, {
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
    async getReplenishmentList(tenantId, branchId) {
        const qb = this.inventoryRepo.createQueryBuilder('inv')
            .leftJoinAndSelect('inv.product', 'product')
            .leftJoinAndSelect('inv.branch', 'branch')
            .where('inv.tenant_id = :tenantId', { tenantId });
        if (branchId) {
            qb.andWhere('inv.branch_id = :branchId', { branchId });
        }
        qb.andWhere('inv.stock_quantity <= inv.min_stock_alert')
            .orderBy('inv.stock_quantity', 'ASC');
        return qb.getMany();
    }
    async findAllBranches(tenantId) {
        return this.branchRepo.find({
            where: { tenant_id: tenantId },
            order: { is_main_branch: 'DESC', name: 'ASC' },
        });
    }
    async createBranch(dto, tenantId) {
        const branch = this.branchRepo.create({ ...dto, tenant_id: tenantId });
        return this.branchRepo.save(branch);
    }
    async updateBranch(id, dto, tenantId) {
        await this.branchRepo.update({ id, tenant_id: tenantId }, dto);
        return this.findOneBranch(id, tenantId);
    }
    async findOneBranch(id, tenantId) {
        const branch = await this.branchRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!branch)
            throw new common_1.NotFoundException(`Sucursal ${id} no encontrada`);
        return branch;
    }
    async findAllCategories(tenantId) {
        return this.categoryRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
    }
    async createCategory(dto, tenantId) {
        const cat = this.categoryRepo.create({ ...dto, tenant_id: tenantId });
        return this.categoryRepo.save(cat);
    }
    async updateCategory(id, dto, tenantId) {
        const cat = await this.categoryRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!cat)
            throw new common_1.NotFoundException('Categoría no encontrada');
        await this.categoryRepo.update({ id, tenant_id: tenantId }, dto);
        return this.categoryRepo.findOne({ where: { id, tenant_id: tenantId } });
    }
    async deleteCategory(id, tenantId) {
        const cat = await this.categoryRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!cat)
            throw new common_1.NotFoundException('Categoría no encontrada');
        await this.productRepo.update({ category_id: id, tenant_id: tenantId }, { category_id: null });
        await this.categoryRepo.delete({ id, tenant_id: tenantId });
    }
    async findAllBrands(tenantId) {
        return this.brandRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
    }
    async createBrand(dto, tenantId) {
        const brand = this.brandRepo.create({ ...dto, tenant_id: tenantId });
        return this.brandRepo.save(brand);
    }
    async updateBrand(id, dto, tenantId) {
        const brand = await this.brandRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!brand)
            throw new common_1.NotFoundException('Marca no encontrada');
        await this.brandRepo.update({ id, tenant_id: tenantId }, dto);
        return this.brandRepo.findOne({ where: { id, tenant_id: tenantId } });
    }
    async deleteBrand(id, tenantId) {
        const brand = await this.brandRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!brand)
            throw new common_1.NotFoundException('Marca no encontrada');
        await this.productRepo.update({ brand_id: id, tenant_id: tenantId }, { brand_id: null });
        await this.brandRepo.delete({ id, tenant_id: tenantId });
    }
    async findAllUnits(tenantId) {
        return this.unitRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
    }
    async createUnit(dto, tenantId) {
        const unit = this.unitRepo.create({ ...dto, tenant_id: tenantId });
        return this.unitRepo.save(unit);
    }
    async updateUnit(id, dto, tenantId) {
        const unit = await this.unitRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!unit)
            throw new common_1.NotFoundException('Unidad de medida no encontrada');
        await this.unitRepo.update({ id, tenant_id: tenantId }, dto);
        return this.unitRepo.findOne({ where: { id, tenant_id: tenantId } });
    }
    async deleteUnit(id, tenantId) {
        const unit = await this.unitRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!unit)
            throw new common_1.NotFoundException('Unidad de medida no encontrada');
        await this.productRepo.update({ unit_id: id, tenant_id: tenantId }, { unit_id: null });
        await this.unitRepo.delete({ id, tenant_id: tenantId });
    }
    async findAllPriceLists(tenantId) {
        return this.priceListRepo.find({ where: { tenant_id: tenantId } });
    }
    async createPriceList(name, tenantId, isDefault = false) {
        const pl = this.priceListRepo.create({ name, is_default: isDefault, tenant_id: tenantId });
        return this.priceListRepo.save(pl);
    }
    async quickSearch(query, tenantId, branchId) {
        const qb = this.productRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.prices', 'prices')
            .leftJoinAndSelect('prices.price_list', 'pl', 'pl.is_default = :def', { def: true })
            .leftJoinAndSelect('p.unit', 'unit')
            .where('p.tenant_id = :tenantId', { tenantId })
            .andWhere('p.is_active = :active', { active: true })
            .andWhere('p.product_type != :rawType', { rawType: 'raw_material' });
        if (query.trim()) {
            qb.andWhere('(p.name LIKE :q OR p.barcode = :exact OR p.internal_code LIKE :q)', { q: `%${query}%`, exact: query });
        }
        else {
            const popularitySubquery = qb.subQuery()
                .select('COALESCE(SUM(popularItem.quantity), 0)')
                .from('sale_items', 'popularItem')
                .innerJoin('sales', 'popularSale', 'popularSale.id = popularItem.sale_id')
                .where('popularItem.product_id = p.id')
                .andWhere('popularSale.tenant_id = :tenantId')
                .andWhere('popularSale.status = :completedStatus')
                .andWhere(branchId ? 'popularSale.branch_id = :popularBranchId' : '1 = 1');
            qb.addSelect(`(${popularitySubquery.getQuery()})`, 'popularity')
                .setParameters({
                tenantId,
                completedStatus: 'completed',
                ...(branchId ? { popularBranchId: branchId } : {}),
            })
                .orderBy('popularity', 'DESC');
        }
        if (branchId) {
            qb.leftJoinAndMapOne('p.inventory', inventory_entity_1.Inventory, 'inv', 'inv.product_id = p.id AND inv.branch_id = :branchId', { branchId });
        }
        return qb.limit(query.trim() ? 20 : 10).getMany();
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __param(2, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __param(3, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __param(4, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(5, (0, typeorm_1.InjectRepository)(brand_entity_1.Brand)),
    __param(6, (0, typeorm_1.InjectRepository)(price_list_entity_1.PriceList)),
    __param(7, (0, typeorm_1.InjectRepository)(product_price_entity_1.ProductPrice)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map