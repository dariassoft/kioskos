import { BaseKioskosEntity } from '../../common/base.entity';
export declare class CashRegister extends BaseKioskosEntity {
    branch_id: string;
    user_id: string;
    opening_balance: number;
    closing_balance: number;
    cash_sales: number;
    status: 'open' | 'closed';
    opened_at: Date;
    closed_at: Date;
}
