export declare class CreateProductDto {
    name: string;
    description?: string;
    barcode?: string;
    internal_code?: string;
    unit_id?: string;
    category_id?: string;
    cost_price?: number;
}
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    barcode?: string;
    internal_code?: string;
    unit_id?: string;
    category_id?: string;
    cost_price?: number;
    is_active?: boolean;
}
export declare class SetPriceDto {
    price_list_id: string;
    price: number;
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
