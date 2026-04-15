import { BaseKioskosEntity } from '../../common/base.entity';
export declare class AccountingLedger extends BaseKioskosEntity {
    reference_id: string;
    date: Date;
    description: string;
    account_name: string;
    debit: number;
    credit: number;
}
