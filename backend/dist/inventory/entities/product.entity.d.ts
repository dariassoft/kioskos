import { BaseKioskosEntity } from '../../common/base.entity';
import { Unit } from './unit.entity';
import { Category } from './category.entity';
import { ProductPrice } from './product-price.entity';
export declare class Product extends BaseKioskosEntity {
    name: string;
    description: string;
    barcode: string;
    internal_code: string;
    unit_id: string;
    category_id: string;
    cost_price: number;
    image_url: string | null;
    min_stock_alert: number;
    is_active: boolean;
    unit: Unit;
    category: Category;
    prices: ProductPrice[];
}
