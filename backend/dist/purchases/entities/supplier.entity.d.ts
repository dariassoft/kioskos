import { BaseKioskosEntity } from '../../common/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
export declare class Supplier extends BaseKioskosEntity {
    name: string;
    contact_name: string;
    phone: string;
    email: string;
    tax_id: string;
    current_account_enabled: boolean;
    opening_balance: number;
    purchase_orders: PurchaseOrder[];
}
