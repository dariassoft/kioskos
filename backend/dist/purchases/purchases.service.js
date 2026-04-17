"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const supplier_entity_1 = require("./entities/supplier.entity");
const purchase_order_entity_1 = require("./entities/purchase-order.entity");
const purchase_order_item_entity_1 = require("./entities/purchase-order-item.entity");
const purchase_received_event_1 = require("./events/purchase-received.event");
const inventory_service_1 = require("../inventory/inventory.service");
let PurchasesService = class PurchasesService {
    constructor(supplierRepo, orderRepo, orderItemRepo, inventoryService, eventEmitter) {
        this.supplierRepo = supplierRepo;
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.inventoryService = inventoryService;
        this.eventEmitter = eventEmitter;
    }
    async findAllSuppliers(tenantId) {
        return this.supplierRepo.find({
            where: { tenant_id: tenantId },
            order: { name: 'ASC' },
        });
    }
    async findOneSupplier(id, tenantId) {
        const supplier = await this.supplierRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!supplier)
            throw new common_1.NotFoundException('Proveedor no encontrado');
        return supplier;
    }
    async createSupplier(dto, tenantId) {
        const supplier = this.supplierRepo.create({ ...dto, tenant_id: tenantId });
        return this.supplierRepo.save(supplier);
    }
    async updateSupplier(id, dto, tenantId) {
        await this.findOneSupplier(id, tenantId);
        await this.supplierRepo.update({ id, tenant_id: tenantId }, dto);
        return this.findOneSupplier(id, tenantId);
    }
    async removeSupplier(id, tenantId) {
        const supplier = await this.findOneSupplier(id, tenantId);
        await this.supplierRepo.remove(supplier);
    }
    async findAllOrders(tenantId) {
        return this.orderRepo.find({
            where: { tenant_id: tenantId },
            relations: ['supplier'],
            order: { created_at: 'DESC' },
        });
    }
    async findOneOrder(id, tenantId) {
        const order = await this.orderRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['supplier', 'items'],
        });
        if (!order)
            throw new common_1.NotFoundException('Orden de compra no encontrada');
        return order;
    }
    async createOrder(dto, tenantId) {
        await this.findOneSupplier(dto.supplier_id, tenantId);
        await this.inventoryService.findOneBranch(dto.branch_id, tenantId);
        for (const item of dto.items) {
            await this.inventoryService.findOneProduct(item.product_id, tenantId);
        }
        const total = dto.items.reduce((acc, item) => acc + Number(item.quantity) * Number(item.unit_cost), 0);
        const order = this.orderRepo.create({
            tenant_id: tenantId,
            supplier_id: dto.supplier_id,
            branch_id: dto.branch_id,
            total,
            status: purchase_order_entity_1.PurchaseOrderStatus.PENDING,
        });
        const savedOrder = await this.orderRepo.save(order);
        const items = dto.items.map((item) => this.orderItemRepo.create({
            purchase_order_id: savedOrder.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            subtotal: Number(item.quantity) * Number(item.unit_cost),
        }));
        await this.orderItemRepo.save(items);
        return this.findOneOrder(savedOrder.id, tenantId);
    }
    async receiveOrder(id, tenantId) {
        const order = await this.findOneOrder(id, tenantId);
        if (order.status === purchase_order_entity_1.PurchaseOrderStatus.RECEIVED) {
            throw new common_1.BadRequestException('Esta orden ya fue recibida');
        }
        if (order.status === purchase_order_entity_1.PurchaseOrderStatus.CANCELLED) {
            throw new common_1.BadRequestException('Esta orden está cancelada');
        }
        for (const item of order.items) {
            await this.inventoryService.addStock({ branch_id: order.branch_id, quantity: item.quantity }, item.product_id, tenantId);
        }
        order.status = purchase_order_entity_1.PurchaseOrderStatus.RECEIVED;
        await this.orderRepo.save(order);
        this.eventEmitter.emit('purchase.received', new purchase_received_event_1.PurchaseReceivedEvent(tenantId, order.id, order.total, order.branch_id));
        return order;
    }
    async cancelOrder(id, tenantId) {
        const order = await this.findOneOrder(id, tenantId);
        if (order.status === purchase_order_entity_1.PurchaseOrderStatus.RECEIVED) {
            throw new common_1.BadRequestException('No se puede cancelar una orden ya recibida');
        }
        order.status = purchase_order_entity_1.PurchaseOrderStatus.CANCELLED;
        return this.orderRepo.save(order);
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(supplier_entity_1.Supplier)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_order_entity_1.PurchaseOrder)),
    __param(2, (0, typeorm_1.InjectRepository)(purchase_order_item_entity_1.PurchaseOrderItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inventory_service_1.InventoryService,
        event_emitter_1.EventEmitter2])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map