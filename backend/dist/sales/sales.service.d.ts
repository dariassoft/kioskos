import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Sale, PaymentMethod } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleReturn } from './entities/sale-return.entity';
import { SaleReturnItem } from './entities/sale-return-item.entity';
import { CashRegister } from './entities/cash-register.entity';
import { Customer } from './entities/customer.entity';
import { CustomerAccountPayment, CustomerPaymentMethod } from './entities/customer-account-payment.entity';
import { PaymentAccount } from './entities/payment-account.entity';
import { Branch } from '@inventory/entities/branch.entity';
import { CreateSaleDto, OpenCashRegisterDto, CloseCashRegisterDto, CreateCustomerDto, UpdateCustomerDto, CreateCustomerPaymentDto, CurrentAccountsQueryDto, ListSalesQueryDto, CreateSaleReturnDto } from './dto/sales.dto';
import { CreatePaymentAccountDto, UpdatePaymentAccountDto } from './dto/payment-account.dto';
import { InventoryService } from '@inventory/inventory.service';
import { ElectronicInvoicingService } from '@electronic-invoicing/electronic-invoicing.service';
export declare class SalesService {
    private readonly saleRepo;
    private readonly saleItemRepo;
    private readonly cashRegisterRepo;
    private readonly customerRepo;
    private readonly customerPaymentRepo;
    private readonly branchRepo;
    private readonly paymentAccountRepo;
    private readonly saleReturnRepo;
    private readonly saleReturnItemRepo;
    private readonly inventoryService;
    private readonly electronicInvoicingService;
    private readonly eventEmitter;
    constructor(saleRepo: Repository<Sale>, saleItemRepo: Repository<SaleItem>, cashRegisterRepo: Repository<CashRegister>, customerRepo: Repository<Customer>, customerPaymentRepo: Repository<CustomerAccountPayment>, branchRepo: Repository<Branch>, paymentAccountRepo: Repository<PaymentAccount>, saleReturnRepo: Repository<SaleReturn>, saleReturnItemRepo: Repository<SaleReturnItem>, inventoryService: InventoryService, electronicInvoicingService: ElectronicInvoicingService, eventEmitter: EventEmitter2);
    openCashRegister(dto: OpenCashRegisterDto, tenantId: string, userId: string): Promise<CashRegister>;
    closeCashRegister(branchId: string, dto: CloseCashRegisterDto, tenantId: string, userId: string): Promise<CashRegister>;
    getActiveRegister(tenantId: string, branchId: string, userId: string): Promise<CashRegister | null>;
    verifySale(id: string, tenantId: string): Promise<Sale>;
    revertSalePayment(saleId: string, tenantId: string): Promise<Sale>;
    uploadVoucher(saleId: string, imageUrl: string, tenantId: string): Promise<Sale>;
    createSale(dto: CreateSaleDto, tenantId: string, userId: string): Promise<Sale>;
    createReturn(saleId: string, dto: CreateSaleReturnDto, tenantId: string): Promise<SaleReturn>;
    listSales(tenantId: string, query: ListSalesQueryDto): Promise<{
        data: Sale[];
        total: number;
        page: number;
        limit: number;
    }>;
    findAllCustomers(tenantId: string): Promise<Customer[]>;
    findCustomerAccounts(query: CurrentAccountsQueryDto, tenantId: string): Promise<{
        data: {
            id: string;
            name: string;
            phone: string;
            email: string;
            credit_limit: number;
            balance: number;
            account_type: "customer";
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOneCustomer(id: string, tenantId: string): Promise<Customer>;
    createCustomer(dto: CreateCustomerDto, tenantId: string): Promise<Customer>;
    updateCustomer(id: string, dto: UpdateCustomerDto, tenantId: string): Promise<Customer>;
    payDebt(id: string, dto: CreateCustomerPaymentDto, tenantId: string): Promise<Customer>;
    getCustomerAccount(id: string, tenantId: string): Promise<{
        account_type: "customer";
        account: {
            id: string;
            name: string;
            phone: string;
            email: string;
            credit_limit: number;
            balance: number;
            account_type: "customer";
        };
        balance: number;
        entries: ({
            id: string;
            date: Date;
            type: "sale";
            description: string;
            amount: number;
            balance_effect: "increase";
            payment_method: PaymentMethod;
        } | {
            id: string;
            date: Date;
            type: "payment";
            description: string;
            amount: number;
            balance_effect: "decrease";
            payment_method: CustomerPaymentMethod;
        } | {
            id: string;
            date: Date;
            type: "return";
            description: string;
            amount: number;
            balance_effect: "decrease";
            payment_method: null;
        })[];
    }>;
    findAllPaymentAccounts(tenantId: string): Promise<PaymentAccount[]>;
    findOnePaymentAccount(id: string, tenantId: string): Promise<PaymentAccount>;
    createPaymentAccount(dto: CreatePaymentAccountDto, tenantId: string): Promise<PaymentAccount>;
    updatePaymentAccount(id: string, dto: UpdatePaymentAccountDto, tenantId: string): Promise<PaymentAccount>;
    deletePaymentAccount(id: string, tenantId: string): Promise<{
        message: string;
    }>;
    private assertBranchExists;
    private shouldAutoVerify;
    private resolvePaymentStatus;
}
