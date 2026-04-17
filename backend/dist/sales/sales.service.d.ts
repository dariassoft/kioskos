import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CashRegister } from './entities/cash-register.entity';
import { Customer } from './entities/customer.entity';
import { PaymentAccount } from './entities/payment-account.entity';
import { Branch } from '@inventory/entities/branch.entity';
import { OpenCashRegisterDto, CloseCashRegisterDto } from './dto/sales.dto';
import { InventoryService } from '@inventory/inventory.service';
export declare class SalesService {
    private readonly saleRepo;
    private readonly saleItemRepo;
    private readonly cashRegisterRepo;
    private readonly customerRepo;
    private readonly branchRepo;
    private readonly paymentAccountRepo;
    private readonly inventoryService;
    private readonly eventEmitter;
    constructor(saleRepo: Repository<Sale>, saleItemRepo: Repository<SaleItem>, cashRegisterRepo: Repository<CashRegister>, customerRepo: Repository<Customer>, branchRepo: Repository<Branch>, paymentAccountRepo: Repository<PaymentAccount>, inventoryService: InventoryService, eventEmitter: EventEmitter2);
    openCashRegister(dto: OpenCashRegisterDto, tenantId: string, userId: string): Promise<CashRegister>;
    closeCashRegister(branchId: string, dto: CloseCashRegisterDto, tenantId: string, userId: string): Promise<CashRegister>;
    getActiveRegister(tenantId: string, branchId: string, userId: string): Promise<CashRegister | null>;
}
