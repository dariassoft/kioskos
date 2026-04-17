import { Repository } from 'typeorm';
import { AccountingService } from '@accounting/accounting.service';
import { SaleCompletedEvent } from '@sales/events/sale-completed.event';
import { PurchaseReceivedEvent } from '@purchases/events/purchase-received.event';
import { Sale } from '@sales/entities/sale.entity';
export declare class AccountingListener {
    private readonly accountingService;
    private readonly saleRepo;
    private readonly tenantRepo;
    private readonly logger;
    constructor(accountingService: AccountingService, saleRepo: Repository<Sale>, tenantRepo: Repository<any>);
    handleSaleCompletedEvent(event: SaleCompletedEvent): Promise<void>;
    handlePurchaseReceivedEvent(event: PurchaseReceivedEvent): Promise<void>;
    handleStockAdjustedEvent(event: {
        tenantId: string;
        productId: string;
        branchId: string;
        quantity: number;
        reason: string;
        newQuantity: number;
    }): Promise<void>;
    private resolveDebitAccount;
}
