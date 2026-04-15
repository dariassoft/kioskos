import { BaseKioskosEntity } from '../../common/base.entity';
import { Product } from './product.entity';
import { Branch } from './branch.entity';
export declare class Inventory extends BaseKioskosEntity {
    product_id: string;
    branch_id: string;
    stock_quantity: number;
    min_stock_alert: number;
    last_restock_date: Date;
    product: Product;
    branch: Branch;
}
