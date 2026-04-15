export declare class SaleCompletedEvent {
    readonly tenantId: string;
    readonly saleId: string;
    readonly total: number;
    readonly paymentMethod: string;
    readonly branchId: string;
    readonly cashierId: string;
    constructor(tenantId: string, saleId: string, total: number, paymentMethod: string, branchId: string, cashierId: string);
}
