import { CustomerPaymentMethod } from '../entities/customer-account-payment.entity';

export class CustomerPaymentCreatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly paymentId: string,
    public readonly customerId: string,
    public readonly amount: number,
    public readonly paymentMethod: CustomerPaymentMethod,
  ) {}
}
