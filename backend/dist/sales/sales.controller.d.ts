import { SalesService } from './sales.service';
import { CreateSaleDto, OpenCashRegisterDto, CloseCashRegisterDto, CreateCustomerDto, UpdateCustomerDto, CreateCustomerPaymentDto, CurrentAccountsQueryDto, ListSalesQueryDto, CreateSaleReturnDto } from './dto/sales.dto';
import { CreatePaymentAccountDto, UpdatePaymentAccountDto } from './dto/payment-account.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    getActiveRegister(tenantId: string, branchId: string, req: any): Promise<import("./entities/cash-register.entity").CashRegister | null>;
    openCashRegister(dto: OpenCashRegisterDto, tenantId: string, req: any): Promise<import("./entities/cash-register.entity").CashRegister>;
    closeCashRegister(branchId: string, dto: CloseCashRegisterDto, tenantId: string, req: any): Promise<import("./entities/cash-register.entity").CashRegister>;
    listSales(tenantId: string, query: ListSalesQueryDto): Promise<{
        data: import("./entities/sale.entity").Sale[];
        total: number;
        page: number;
        limit: number;
    }>;
    createSale(dto: CreateSaleDto, tenantId: string, req: any): Promise<import("./entities/sale.entity").Sale>;
    createReturn(id: string, dto: CreateSaleReturnDto, tenantId: string): Promise<import("./entities/sale-return.entity").SaleReturn>;
    verifySalePayment(id: string, tenantId: string): Promise<import("./entities/sale.entity").Sale>;
    revertSalePayment(id: string, tenantId: string): Promise<import("./entities/sale.entity").Sale>;
    uploadVoucher(id: string, tenantId: string, file: Express.Multer.File): Promise<import("./entities/sale.entity").Sale>;
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
    findAllCustomers(tenantId: string): Promise<import("./entities/customer.entity").Customer[]>;
    createCustomer(dto: CreateCustomerDto, tenantId: string): Promise<import("./entities/customer.entity").Customer>;
    updateCustomer(id: string, dto: UpdateCustomerDto, tenantId: string): Promise<import("./entities/customer.entity").Customer>;
    payDebt(id: string, dto: CreateCustomerPaymentDto, tenantId: string): Promise<import("./entities/customer.entity").Customer>;
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
            payment_method: import("./entities/sale.entity").PaymentMethod;
        } | {
            id: string;
            date: Date;
            type: "payment";
            description: string;
            amount: number;
            balance_effect: "decrease";
            payment_method: import("./entities/customer-account-payment.entity").CustomerPaymentMethod;
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
    findAllPaymentAccounts(tenantId: string): Promise<import("./entities/payment-account.entity").PaymentAccount[]>;
    createPaymentAccount(dto: CreatePaymentAccountDto, tenantId: string): Promise<import("./entities/payment-account.entity").PaymentAccount>;
    updatePaymentAccount(id: string, dto: UpdatePaymentAccountDto, tenantId: string): Promise<import("./entities/payment-account.entity").PaymentAccount>;
    deletePaymentAccount(id: string, tenantId: string): Promise<{
        message: string;
    }>;
}
