import { BaseKioskosEntity } from '../../common/base.entity';
import { Customer } from './customer.entity';
import { SaleItem } from './sale-item.entity';
export declare enum PaymentMethod {
    CASH = "cash",
    CARD = "card",
    TRANSFER = "transfer",
    CREDIT_CLIENT = "credit_client"
}
export declare enum SaleStatus {
    COMPLETED = "completed",
    REFUNDED = "refunded",
    PENDING = "pending"
}
export declare class Sale extends BaseKioskosEntity {
    branch_id: string;
    user_id: string;
    customer_id: string;
    total: number;
    payment_method: PaymentMethod;
    status: SaleStatus;
    customer: Customer;
    items: SaleItem[];
}
