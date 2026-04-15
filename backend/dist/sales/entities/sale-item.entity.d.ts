import { Sale } from './sale.entity';
export declare class SaleItem {
    id: string;
    sale_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    sale: Sale;
}
