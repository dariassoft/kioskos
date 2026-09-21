export class SaleCompletedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly saleId: string,
    public readonly total: number,
    public readonly paymentMethod: string,
    public readonly branchId: string,
    public readonly cashierId: string,
    public readonly netAmount?: number,
    public readonly vatAmount?: number,
  ) {}
}
