import { InventoryService } from './inventory.service';
import { CreateProductDto, UpdateProductDto, SetPriceDto, UpdateStockDto, CreateBranchDto, CreateCategoryDto, CreateUnitDto, ProductQueryDto, BulkUpdatePriceDto, CreateBrandDto } from './dto/inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findAllProducts(tenantId: string, query: ProductQueryDto): Promise<{
        data: import("./entities/product.entity").Product[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    quickSearch(tenantId: string, q: string, branchId?: string): Promise<import("./entities/product.entity").Product[]>;
    findOne(id: string, tenantId: string): Promise<import("./entities/product.entity").Product>;
    createProduct(dto: CreateProductDto, tenantId: string): Promise<import("./entities/product.entity").Product>;
    updateProduct(id: string, dto: UpdateProductDto, tenantId: string): Promise<import("./entities/product.entity").Product>;
    deleteProduct(id: string, tenantId: string): Promise<void>;
    uploadProductImage(id: string, tenantId: string, file: Express.Multer.File): Promise<import("./entities/product.entity").Product>;
    setPrice(productId: string, dto: SetPriceDto, tenantId: string): Promise<import("./entities/product-price.entity").ProductPrice>;
    bulkUpdatePrices(dto: BulkUpdatePriceDto, tenantId: string): Promise<{
        updated: number;
    }>;
    getStock(tenantId: string, branchId: string): Promise<import("./entities/inventory.entity").Inventory[]>;
    getLowStock(tenantId: string): Promise<import("./entities/inventory.entity").Inventory[]>;
    getReplenishment(tenantId: string, branchId?: string): Promise<import("./entities/inventory.entity").Inventory[]>;
    adjustStock(tenantId: string, dto: {
        product_id: string;
        branch_id: string;
        quantity: number;
        reason: string;
    }): Promise<import("./entities/inventory.entity").Inventory>;
    addStock(productId: string, dto: UpdateStockDto, tenantId: string): Promise<import("./entities/inventory.entity").Inventory>;
    findBranches(tenantId: string): Promise<import("./entities/branch.entity").Branch[]>;
    createBranch(dto: CreateBranchDto, tenantId: string): Promise<import("./entities/branch.entity").Branch>;
    updateBranch(id: string, dto: CreateBranchDto, tenantId: string): Promise<import("./entities/branch.entity").Branch>;
    findCategories(tenantId: string): Promise<import("./entities/category.entity").Category[]>;
    createCategory(dto: CreateCategoryDto, tenantId: string): Promise<import("./entities/category.entity").Category>;
    findAllBrands(tenantId: string): Promise<import("./entities/brand.entity").Brand[]>;
    createBrand(dto: CreateBrandDto, tenantId: string): Promise<import("./entities/brand.entity").Brand>;
    findUnits(tenantId: string): Promise<import("./entities/unit.entity").Unit[]>;
    createUnit(dto: CreateUnitDto, tenantId: string): Promise<import("./entities/unit.entity").Unit>;
    findPriceLists(tenantId: string): Promise<import("./entities/price-list.entity").PriceList[]>;
    createPriceList(body: {
        name: string;
        is_default?: boolean;
    }, tenantId: string): Promise<import("./entities/price-list.entity").PriceList>;
}
