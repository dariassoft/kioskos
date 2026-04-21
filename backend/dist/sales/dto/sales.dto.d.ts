import { PaymentMethod, PaymentStatus } from '../entities/sale.entity';
export declare class CreateCustomerDto {
    name: string;
    email?: string;
    phone?: string;
    credit_limit?: number;
}
export declare class UpdateCustomerDto extends CreateCustomerDto {
}
export declare class OpenCashRegisterDto {
    branch_id: string;
    opening_balance: number;
}
export declare class CloseCashRegisterDto {
    closing_balance: number;
}
export declare class CreateSaleItemDto {
    product_id: string;
    quantity: number;
    unit_price: number;
}
export declare class PaymentDetailsDto {
    mp_payment_id?: string;
    mp_payment_status?: string;
    payer_name?: string;
    payer_email?: string;
    transfer_voucher?: string;
    transfer_origin?: string;
    card_last_digits?: string;
    card_brand?: string;
    authorization_code?: string;
    payment_notes?: string;
}
export declare class CreateSaleDto {
    branch_id: string;
    customer_id?: string;
    payment_method: PaymentMethod;
    payment_status?: PaymentStatus;
    items: CreateSaleItemDto[];
    payment_details?: PaymentDetailsDto;
    request_invoice?: boolean;
    invoice_doc_tipo?: number;
    invoice_doc_nro?: string;
}
export declare class ListSalesQueryDto {
    page?: number;
    limit?: number;
    payment_status?: PaymentStatus;
    start_date?: string;
    end_date?: string;
}
