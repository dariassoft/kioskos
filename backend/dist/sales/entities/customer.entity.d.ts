import { BaseKioskosEntity } from '../../common/base.entity';
import { Sale } from './sale.entity';
export declare class Customer extends BaseKioskosEntity {
    name: string;
    email: string;
    phone: string;
    credit_limit: number;
    current_debt: number;
    sales: Sale[];
}
