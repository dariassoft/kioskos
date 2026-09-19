export class ProductionCompletedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly productionOrderId: string,
    public readonly branchId: string,
    public readonly totalInputCost: number,
  ) {}
}
