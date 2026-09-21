export declare class PurchaseReceivedEvent {
    readonly tenantId: string;
    readonly purchaseOrderId: string;
    readonly total: number;
    readonly branchId: string;
    readonly netAmount: number;
    readonly vatAmount: number;
    constructor(tenantId: string, purchaseOrderId: string, total: number, branchId: string, netAmount?: number, vatAmount?: number);
}
