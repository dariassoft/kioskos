import { BaseKioskosEntity } from '../../common/base.entity';
import { Supplier } from './supplier.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
export declare enum PurchaseOrderStatus {
    PENDING = "pending",
    RECEIVED = "received",
    CANCELLED = "cancelled"
}
export declare class PurchaseOrder extends BaseKioskosEntity {
    supplier_id: string;
    branch_id: string;
    total: number;
    status: PurchaseOrderStatus;
    supplier: Supplier;
    items: PurchaseOrderItem[];
}
