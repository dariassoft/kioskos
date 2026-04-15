export declare class PurchaseReceivedEvent {
    readonly tenantId: string;
    readonly purchaseOrderId: string;
    readonly total: number;
    readonly branchId: string;
    constructor(tenantId: string, purchaseOrderId: string, total: number, branchId: string);
}
