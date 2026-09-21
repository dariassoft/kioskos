export class SaleReturnedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly saleReturnId: string,
    public readonly saleId: string,
    public readonly total: number,
    public readonly netAmount: number,
    public readonly vatAmount: number,
    public readonly branchId: string,
  ) {}
}
