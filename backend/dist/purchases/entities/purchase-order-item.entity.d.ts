import { PurchaseOrder } from './purchase-order.entity';
export declare class PurchaseOrderItem {
    id: string;
    purchase_order_id: string;
    product_id: string;
    quantity: number;
    unit_cost: number;
    subtotal: number;
    purchase_order: PurchaseOrder;
}
