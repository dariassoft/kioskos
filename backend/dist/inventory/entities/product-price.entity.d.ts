import { Product } from './product.entity';
import { PriceList } from './price-list.entity';
export declare class ProductPrice {
    id: string;
    product_id: string;
    price_list_id: string;
    price: number;
    created_at: Date;
    updated_at: Date;
    product: Product;
    price_list: PriceList;
}
