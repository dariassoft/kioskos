import { PaymentMethod } from '../entities/sale.entity';
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
export declare class CreateSaleDto {
    branch_id: string;
    customer_id?: string;
    payment_method: PaymentMethod;
    items: CreateSaleItemDto[];
}
