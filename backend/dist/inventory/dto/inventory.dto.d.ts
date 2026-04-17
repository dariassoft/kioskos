export declare class CreateProductDto {
    name: string;
    description?: string;
    barcode?: string;
    internal_code?: string;
    unit_id?: string;
    category_id?: string;
    cost_price?: number;
    min_stock_alert?: number;
    image_url?: string;
    brand_id?: string;
    supplier_id?: string;
    sale_price?: number;
    sale_margin?: number;
}
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    barcode?: string;
    internal_code?: string;
    unit_id?: string;
    category_id?: string;
    cost_price?: number;
    image_url?: string;
    min_stock_alert?: number;
    is_active?: boolean;
    brand_id?: string;
    supplier_id?: string;
}
export declare class SetPriceDto {
    price_list_id: string;
    price: number;
}
export declare class CreateBrandDto {
    name: string;
}
export declare class UpdateStockDto {
    branch_id: string;
    quantity: number;
    min_stock_alert?: number;
}
export declare class CreateBranchDto {
    name: string;
    address?: string;
    phone?: string;
    is_main_branch?: boolean;
}
export declare class CreateCategoryDto {
    name: string;
    color?: string;
    icon?: string;
}
export declare class CreateUnitDto {
    name: string;
    abbreviation?: string;
}
export declare class ProductQueryDto {
    search?: string;
    category_id?: string;
    page?: number;
    limit?: number;
}
export declare enum PriceAdjustmentType {
    PERCENTAGE = "percentage",
    FIXED = "fixed"
}
export declare class BulkUpdatePriceDto {
    category_id?: string;
    supplier_id?: string;
    brand_id?: string;
    adjustment_type: PriceAdjustmentType;
    value: number;
    price_list_id?: string;
}
export declare class TransferStockDto {
    product_id: string;
    from_branch_id: string;
    to_branch_id: string;
    quantity: number;
}
