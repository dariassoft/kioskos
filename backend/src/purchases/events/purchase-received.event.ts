export class PurchaseReceivedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly purchaseOrderId: string,
    public readonly total: number,
    public readonly branchId: string,
    public readonly netAmount = total,
    public readonly vatAmount = 0,
  ) {}
}
