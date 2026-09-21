import { PurchasesService } from './purchases.service';
import { CreateSupplierDto, UpdateSupplierDto, CreatePurchaseOrderDto, CreatePurchasePaymentDto } from './dto/purchases.dto';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    findAllSuppliers(tenantId: string): Promise<import("./entities/supplier.entity").Supplier[]>;
    createSupplier(dto: CreateSupplierDto, tenantId: string): Promise<import("./entities/supplier.entity").Supplier>;
    updateSupplier(id: string, dto: UpdateSupplierDto, tenantId: string): Promise<import("./entities/supplier.entity").Supplier>;
    removeSupplier(id: string, tenantId: string): Promise<void>;
    findAllOrders(tenantId: string): Promise<import("./entities/purchase-order.entity").PurchaseOrder[]>;
    createOrder(dto: CreatePurchaseOrderDto, tenantId: string): Promise<import("./entities/purchase-order.entity").PurchaseOrder>;
    receiveOrder(id: string, tenantId: string): Promise<import("./entities/purchase-order.entity").PurchaseOrder>;
    cancelOrder(id: string, tenantId: string): Promise<import("./entities/purchase-order.entity").PurchaseOrder>;
    listPayments(id: string, tenantId: string): Promise<import("./entities/purchase-payment.entity").PurchasePayment[]>;
    createPayment(id: string, dto: CreatePurchasePaymentDto, tenantId: string): Promise<import("./entities/purchase-payment.entity").PurchasePayment>;
}
