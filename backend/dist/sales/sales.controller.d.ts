import { SalesService } from './sales.service';
import { CreateSaleDto, OpenCashRegisterDto, CloseCashRegisterDto, CreateCustomerDto, UpdateCustomerDto, ListSalesQueryDto } from './dto/sales.dto';
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
    verifySalePayment(id: string, tenantId: string): Promise<import("./entities/sale.entity").Sale>;
    findAllCustomers(tenantId: string): Promise<import("./entities/customer.entity").Customer[]>;
    createCustomer(dto: CreateCustomerDto, tenantId: string): Promise<import("./entities/customer.entity").Customer>;
    updateCustomer(id: string, dto: UpdateCustomerDto, tenantId: string): Promise<import("./entities/customer.entity").Customer>;
    payDebt(id: string, amount: number, tenantId: string): Promise<import("./entities/customer.entity").Customer>;
}
