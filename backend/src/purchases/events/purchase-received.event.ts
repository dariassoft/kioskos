export class PurchaseReceivedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly purchaseOrderId: string,
    public readonly total: number,
    public readonly branchId: string,
  ) {}
}
