import { Repository } from 'typeorm';
import { AccountingService } from '@accounting/accounting.service';
import { SaleCompletedEvent } from '@sales/events/sale-completed.event';
import { PurchaseReceivedEvent } from '@purchases/events/purchase-received.event';
import { PurchasePaymentCreatedEvent } from '@purchases/events/purchase-payment-created.event';
import { PurchaseReturnedEvent } from '@purchases/events/purchase-returned.event';
import { Sale } from '@sales/entities/sale.entity';
import { SaleReturnedEvent } from '@sales/events/sale-returned.event';
import { ExpenseVoidedEvent } from '../expenses/events/expense-voided.event';
export declare class AccountingListener {
    private readonly accountingService;
    private readonly saleRepo;
    private readonly tenantRepo;
    private readonly logger;
    constructor(accountingService: AccountingService, saleRepo: Repository<Sale>, tenantRepo: Repository<any>);
    handleSaleCompletedEvent(event: SaleCompletedEvent): Promise<void>;
    handlePurchaseReceivedEvent(event: PurchaseReceivedEvent): Promise<void>;
    handleSaleReturnedEvent(event: SaleReturnedEvent): Promise<void>;
    handlePurchaseReturnedEvent(event: PurchaseReturnedEvent): Promise<void>;
    handlePurchasePayment(event: PurchasePaymentCreatedEvent): Promise<void>;
    handleExpenseCreatedEvent(event: {
        tenantId: string;
        expenseId: string;
        amount: number;
        categoryName: string;
        paymentMethod: string;
        branchId: string | null;
    }): Promise<void>;
    handleExpenseVoidedEvent(event: ExpenseVoidedEvent): Promise<void>;
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
