import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { CreateSupplierDto, UpdateSupplierDto, CreatePurchaseOrderDto } from './dto/purchases.dto';
import { InventoryService } from '../inventory/inventory.service';
export declare class PurchasesService {
    private readonly supplierRepo;
    private readonly orderRepo;
    private readonly orderItemRepo;
    private readonly inventoryService;
    private readonly eventEmitter;
    constructor(supplierRepo: Repository<Supplier>, orderRepo: Repository<PurchaseOrder>, orderItemRepo: Repository<PurchaseOrderItem>, inventoryService: InventoryService, eventEmitter: EventEmitter2);
    findAllSuppliers(tenantId: string): Promise<Supplier[]>;
    findOneSupplier(id: string, tenantId: string): Promise<Supplier>;
    createSupplier(dto: CreateSupplierDto, tenantId: string): Promise<Supplier>;
    updateSupplier(id: string, dto: UpdateSupplierDto, tenantId: string): Promise<Supplier>;
    removeSupplier(id: string, tenantId: string): Promise<void>;
    findAllOrders(tenantId: string): Promise<PurchaseOrder[]>;
    findOneOrder(id: string, tenantId: string): Promise<PurchaseOrder>;
    createOrder(dto: CreatePurchaseOrderDto, tenantId: string): Promise<PurchaseOrder>;
    receiveOrder(id: string, tenantId: string): Promise<PurchaseOrder>;
    cancelOrder(id: string, tenantId: string): Promise<PurchaseOrder>;
}
