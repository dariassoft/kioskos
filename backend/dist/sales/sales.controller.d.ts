import { SalesService } from './sales.service';
import { CreateSaleDto, OpenCashRegisterDto, CloseCashRegisterDto, CreateCustomerDto, UpdateCustomerDto, ListSalesQueryDto } from './dto/sales.dto';
import { CreatePaymentAccountDto, UpdatePaymentAccountDto } from './dto/payment-account.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    getActiveRegister(tenantId: string, branchId: string, req: any): Promise<import("./entities/cash-register.entity").CashRegister | null>;
    openCashRegister(dto: OpenCashRegisterDto, tenantId: string, req: any): Promise<import("./entities/cash-register.entity").CashRegister>;
    closeCashRegister(branchId: string, dto: CloseCashRegisterDto, tenantId: string, req: any): Promise<import("./entities/cash-register.entity").CashRegister>;
    listSales(tenantId: string, query: ListSalesQueryDto): any;
    createSale(dto: CreateSaleDto, tenantId: string, req: any): any;
    verifySalePayment(id: string, tenantId: string): any;
    revertSalePayment(id: string, tenantId: string): any;
    uploadVoucher(id: string, tenantId: string, file: Express.Multer.File): Promise<any>;
    findAllCustomers(tenantId: string): any;
    createCustomer(dto: CreateCustomerDto, tenantId: string): any;
    updateCustomer(id: string, dto: UpdateCustomerDto, tenantId: string): any;
    payDebt(id: string, amount: number, tenantId: string): any;
    findAllPaymentAccounts(tenantId: string): any;
    createPaymentAccount(dto: CreatePaymentAccountDto, tenantId: string): any;
    updatePaymentAccount(id: string, dto: UpdatePaymentAccountDto, tenantId: string): any;
    deletePaymentAccount(id: string, tenantId: string): any;
}
