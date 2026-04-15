import { AccountingService } from './accounting.service';
import { SaleCompletedEvent } from '../sales/events/sale-completed.event';
import { PurchaseReceivedEvent } from '../purchases/events/purchase-received.event';
export declare class AccountingListener {
    private readonly accountingService;
    private readonly logger;
    constructor(accountingService: AccountingService);
    handleSaleCompletedEvent(event: SaleCompletedEvent): Promise<void>;
    handlePurchaseReceivedEvent(event: PurchaseReceivedEvent): Promise<void>;
}
