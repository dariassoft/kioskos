export declare class StockReducedEvent {
    readonly tenantId: string;
    readonly productId: string;
    readonly branchId: string;
    readonly newQuantity: number;
    readonly productName: string;
    constructor(tenantId: string, productId: string, branchId: string, newQuantity: number, productName: string);
}
