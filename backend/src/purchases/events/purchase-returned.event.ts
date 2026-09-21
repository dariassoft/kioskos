export class PurchaseReturnedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly purchaseReturnId: string,
    public readonly purchaseOrderId: string,
    public readonly total: number,
    public readonly netAmount: number,
    public readonly vatAmount: number,
    public readonly branchId: string,
    public readonly settlementMethod: string,
    public readonly refundAmount: number,
  ) {}
}
