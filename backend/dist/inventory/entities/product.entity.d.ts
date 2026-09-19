import { BaseKioskosEntity } from '../../common/base.entity';
import { Unit } from './unit.entity';
import { Category } from './category.entity';
import { ProductPrice } from './product-price.entity';
import { Inventory } from './inventory.entity';
import { Supplier } from '../../purchases/entities/supplier.entity';
import { Brand } from './brand.entity';
export declare enum ProductType {
    STANDARD = "standard",
    RAW_MATERIAL = "raw_material",
    FRACTIONATED = "fractionated",
    ELABORATED = "elaborated"
}
export declare class Product extends BaseKioskosEntity {
    name: string;
    description: string;
    barcode: string;
    internal_code: string;
    unit_id: string;
    category_id: string;
    cost_price: number;
    image_url: string | null;
    brand_id: string;
    supplier_id: string;
    min_stock_alert: number;
    is_active: boolean;
    product_type: ProductType;
    unit: Unit;
    category: Category;
    brand: Brand;
    supplier: Supplier;
    prices: ProductPrice[];
    inventory_records: Inventory[];
}
