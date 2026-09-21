export class ExpenseVoidedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly expenseId: string,
    public readonly amount: number,
    public readonly categoryName: string,
    public readonly paymentMethod: string,
    public readonly branchId: string | null,
    public readonly reason: string,
  ) {}
}
