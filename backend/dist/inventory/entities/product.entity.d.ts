import { BaseKioskosEntity } from '../../common/base.entity';
import { Unit } from './unit.entity';
import { Category } from './category.entity';
import { ProductPrice } from './product-price.entity';
import { Supplier } from '../../purchases/entities/supplier.entity';
export declare class Product extends BaseKioskosEntity {
    name: string;
    description: string;
    barcode: string;
    internal_code: string;
    unit_id: string;
    category_id: string;
    cost_price: number;
    image_url: string | null;
    brand: string;
    supplier_id: string;
    min_stock_alert: number;
    is_active: boolean;
    unit: Unit;
    category: Category;
    supplier: Supplier;
    prices: ProductPrice[];
}
