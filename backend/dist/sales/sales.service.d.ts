import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CashRegister } from './entities/cash-register.entity';
import { Customer } from './entities/customer.entity';
import { CreateSaleDto, OpenCashRegisterDto, CloseCashRegisterDto, CreateCustomerDto, UpdateCustomerDto } from './dto/sales.dto';
import { InventoryService } from '../inventory/inventory.service';
export declare class SalesService {
    private readonly saleRepo;
    private readonly saleItemRepo;
    private readonly cashRegisterRepo;
    private readonly customerRepo;
    private readonly inventoryService;
    private readonly eventEmitter;
    constructor(saleRepo: Repository<Sale>, saleItemRepo: Repository<SaleItem>, cashRegisterRepo: Repository<CashRegister>, customerRepo: Repository<Customer>, inventoryService: InventoryService, eventEmitter: EventEmitter2);
    openCashRegister(dto: OpenCashRegisterDto, tenantId: string, userId: string): Promise<CashRegister>;
    closeCashRegister(branchId: string, dto: CloseCashRegisterDto, tenantId: string, userId: string): Promise<CashRegister>;
    getActiveRegister(tenantId: string, branchId: string, userId: string): Promise<CashRegister | null>;
    createSale(dto: CreateSaleDto, tenantId: string, userId: string): Promise<Sale>;
    findAllCustomers(tenantId: string): Promise<Customer[]>;
    findOneCustomer(id: string, tenantId: string): Promise<Customer>;
    createCustomer(dto: CreateCustomerDto, tenantId: string): Promise<Customer>;
    updateCustomer(id: string, dto: UpdateCustomerDto, tenantId: string): Promise<Customer>;
    payDebt(id: string, amount: number, tenantId: string): Promise<Customer>;
}
