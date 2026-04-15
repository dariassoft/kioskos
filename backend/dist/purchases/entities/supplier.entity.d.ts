import { BaseKioskosEntity } from '../../common/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
export declare class Supplier extends BaseKioskosEntity {
    name: string;
    contact_name: string;
    phone: string;
    email: string;
    tax_id: string;
    purchase_orders: PurchaseOrder[];
}
