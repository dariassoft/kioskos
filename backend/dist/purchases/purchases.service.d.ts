import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchasePayment } from './entities/purchase-payment.entity';
import { PurchaseReturn } from './entities/purchase-return.entity';
import { PurchaseReturnItem } from './entities/purchase-return-item.entity';
import { Product } from '../inventory/entities/product.entity';
import { CreateSupplierDto, UpdateSupplierDto, CreatePurchaseOrderDto, UpdatePurchaseOrderDto, ReceivePurchaseOrderDto, CreatePurchasePaymentDto, CreatePurchaseReturnDto } from './dto/purchases.dto';
import { InventoryService } from '../inventory/inventory.service';
export declare class PurchasesService {
    private readonly supplierRepo;
    private readonly orderRepo;
    private readonly orderItemRepo;
    private readonly paymentRepo;
    private readonly purchaseReturnRepo;
    private readonly purchaseReturnItemRepo;
    private readonly productRepo;
    private readonly inventoryService;
    private readonly eventEmitter;
    constructor(supplierRepo: Repository<Supplier>, orderRepo: Repository<PurchaseOrder>, orderItemRepo: Repository<PurchaseOrderItem>, paymentRepo: Repository<PurchasePayment>, purchaseReturnRepo: Repository<PurchaseReturn>, purchaseReturnItemRepo: Repository<PurchaseReturnItem>, productRepo: Repository<Product>, inventoryService: InventoryService, eventEmitter: EventEmitter2);
    findAllSuppliers(tenantId: string): Promise<Supplier[]>;
    findOneSupplier(id: string, tenantId: string): Promise<Supplier>;
    createSupplier(dto: CreateSupplierDto, tenantId: string): Promise<Supplier>;
    updateSupplier(id: string, dto: UpdateSupplierDto, tenantId: string): Promise<Supplier>;
    removeSupplier(id: string, tenantId: string): Promise<void>;
    findAllOrders(tenantId: string): Promise<PurchaseOrder[]>;
    findOneOrder(id: string, tenantId: string): Promise<PurchaseOrder>;
    createOrder(dto: CreatePurchaseOrderDto, tenantId: string): Promise<PurchaseOrder>;
    updateOrder(id: string, dto: UpdatePurchaseOrderDto, tenantId: string): Promise<PurchaseOrder>;
    receiveOrder(id: string, tenantId: string, dto?: ReceivePurchaseOrderDto): Promise<PurchaseOrder>;
    listPayments(orderId: string, tenantId: string): Promise<PurchasePayment[]>;
    createPayment(orderId: string, dto: CreatePurchasePaymentDto, tenantId: string): Promise<PurchasePayment>;
    createReturn(orderId: string, dto: CreatePurchaseReturnDto, tenantId: string): Promise<PurchaseReturn>;
    getSupplierAccount(id: string, tenantId: string): Promise<{
        supplier: Supplier;
        balance: number;
        entries: {
            id: string;
            date: Date;
            type: string;
            description: string;
            amount: number;
            direction: string;
        }[];
    }>;
    cancelOrder(id: string, tenantId: string): Promise<PurchaseOrder>;
}
