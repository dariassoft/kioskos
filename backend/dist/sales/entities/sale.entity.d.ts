import { BaseKioskosEntity } from '../../common/base.entity';
import { Customer } from './customer.entity';
import { SaleItem } from './sale-item.entity';
export declare enum PaymentMethod {
    CASH = "cash",
    DEBIT_CARD = "debit_card",
    CREDIT_CARD = "credit_card",
    TRANSFER = "transfer",
    QR_MERCADOPAGO = "qr_mercadopago",
    LINK_MERCADOPAGO = "link_mercadopago",
    CREDIT_CLIENT = "credit_client"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    FAILED = "failed"
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
    payment_status: PaymentStatus;
    status: SaleStatus;
    mp_payment_id: string | null;
    mp_payment_status: string | null;
    payer_name: string | null;
    payer_email: string | null;
    transfer_voucher: string | null;
    transfer_origin: string | null;
    card_last_digits: string | null;
    card_brand: string | null;
    authorization_code: string | null;
    payment_notes: string | null;
    payment_verified_at: Date | null;
    voucher_image_url: string | null;
    customer: Customer;
    items: SaleItem[];
}
