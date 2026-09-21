export class PurchasePaymentCreatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly paymentId: string,
    public readonly purchaseOrderId: string,
    public readonly amount: number,
    public readonly paymentMethod: string,
  ) {}
}