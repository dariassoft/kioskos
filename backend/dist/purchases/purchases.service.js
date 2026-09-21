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
const purchase_payment_entity_1 = require("./entities/purchase-payment.entity");
const purchase_return_entity_1 = require("./entities/purchase-return.entity");
const purchase_return_item_entity_1 = require("./entities/purchase-return-item.entity");
const product_entity_1 = require("../inventory/entities/product.entity");
const inventory_entity_1 = require("../inventory/entities/inventory.entity");
const purchase_received_event_1 = require("./events/purchase-received.event");
const inventory_service_1 = require("../inventory/inventory.service");
const purchase_payment_created_event_1 = require("./events/purchase-payment-created.event");
const purchase_returned_event_1 = require("./events/purchase-returned.event");
let PurchasesService = class PurchasesService {
    constructor(supplierRepo, orderRepo, orderItemRepo, paymentRepo, purchaseReturnRepo, purchaseReturnItemRepo, productRepo, inventoryService, eventEmitter) {
        this.supplierRepo = supplierRepo;
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.paymentRepo = paymentRepo;
        this.purchaseReturnRepo = purchaseReturnRepo;
        this.purchaseReturnItemRepo = purchaseReturnItemRepo;
        this.productRepo = productRepo;
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
        const orders = await this.orderRepo.find({
            where: { tenant_id: tenantId },
            relations: ['supplier', 'items', 'items.product'],
            order: { created_at: 'DESC' },
        });
        const payments = await this.paymentRepo.createQueryBuilder('payment')
            .select('payment.purchase_order_id', 'orderId')
            .addSelect('COALESCE(SUM(payment.amount), 0)', 'paidAmount')
            .where('payment.tenant_id = :tenantId', { tenantId })
            .groupBy('payment.purchase_order_id')
            .getRawMany();
        const paidByOrder = new Map(payments.map((payment) => [payment.orderId, Number(payment.paidAmount)]));
        return orders.map((order) => ({
            ...order,
            paid_amount: paidByOrder.get(order.id) || 0,
            payment_status: Number(paidByOrder.get(order.id) || 0) >= Number(order.total) - 0.01 ? 'paid' : 'pending',
        }));
    }
    async findOneOrder(id, tenantId) {
        const order = await this.orderRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['supplier', 'items', 'items.product'],
        });
        if (!order)
            throw new common_1.NotFoundException('Orden de compra no encontrada');
        return order;
    }
    async createOrder(dto, tenantId) {
        await this.findOneSupplier(dto.supplier_id, tenantId);
        await this.inventoryService.findOneBranch(dto.branch_id, tenantId);
        const products = new Map();
        for (const item of dto.items) {
            const product = await this.inventoryService.findOneProduct(item.product_id, tenantId);
            products.set(item.product_id, product);
        }
        const total = dto.items.reduce((acc, item) => {
            const vatRate = Number(item.vat_rate ?? products.get(item.product_id)?.vat_rate ?? 0);
            const net = Number(item.quantity) * Number(item.unit_cost);
            return acc + net + (net * vatRate / 100);
        }, 0);
        const order = this.orderRepo.create({
            tenant_id: tenantId,
            supplier_id: dto.supplier_id,
            branch_id: dto.branch_id,
            total,
            status: purchase_order_entity_1.PurchaseOrderStatus.PENDING,
        });
        const savedOrder = await this.orderRepo.save(order);
        const items = dto.items.map((item) => {
            const vatRate = Number(item.vat_rate ?? products.get(item.product_id)?.vat_rate ?? 0);
            const net = Number(item.quantity) * Number(item.unit_cost);
            const vat = net * vatRate / 100;
            return this.orderItemRepo.create({
                purchase_order_id: savedOrder.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                vat_rate: vatRate,
                net_subtotal: net,
                vat_amount: vat,
                subtotal: net + vat,
            });
        });
        await this.orderItemRepo.save(items);
        return this.findOneOrder(savedOrder.id, tenantId);
    }
    async updateOrder(id, dto, tenantId) {
        const order = await this.findOneOrder(id, tenantId);
        if (order.status !== purchase_order_entity_1.PurchaseOrderStatus.PENDING) {
            throw new common_1.BadRequestException('Solo se puede editar una orden que todavía no fue recibida o cancelada');
        }
        await this.findOneSupplier(dto.supplier_id, tenantId);
        await this.inventoryService.findOneBranch(dto.branch_id, tenantId);
        const products = new Map();
        for (const item of dto.items)
            products.set(item.product_id, await this.inventoryService.findOneProduct(item.product_id, tenantId));
        await this.orderItemRepo.delete({ purchase_order_id: order.id });
        const items = dto.items.map((item) => {
            const vatRate = Number(item.vat_rate ?? products.get(item.product_id)?.vat_rate ?? 0);
            const net = Number(item.quantity) * Number(item.unit_cost);
            const vat = net * vatRate / 100;
            return this.orderItemRepo.create({ purchase_order_id: order.id, product_id: item.product_id, quantity: item.quantity,
                unit_cost: item.unit_cost, vat_rate: vatRate, net_subtotal: net, vat_amount: vat, subtotal: net + vat });
        });
        await this.orderItemRepo.save(items);
        order.supplier_id = dto.supplier_id;
        order.branch_id = dto.branch_id;
        order.total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
        await this.orderRepo.save(order);
        return this.findOneOrder(id, tenantId);
    }
    async receiveOrder(id, tenantId, dto) {
        const order = await this.findOneOrder(id, tenantId);
        if (order.status === purchase_order_entity_1.PurchaseOrderStatus.RECEIVED) {
            throw new common_1.BadRequestException('Esta orden ya fue recibida');
        }
        if (order.status === purchase_order_entity_1.PurchaseOrderStatus.CANCELLED) {
            throw new common_1.BadRequestException('Esta orden está cancelada');
        }
        if (dto?.items?.length) {
            const products = new Map();
            for (const item of dto.items)
                products.set(item.product_id, await this.inventoryService.findOneProduct(item.product_id, tenantId));
            await this.orderItemRepo.delete({ purchase_order_id: order.id });
            const actualItems = dto.items.map((item) => {
                const vatRate = Number(item.vat_rate ?? products.get(item.product_id)?.vat_rate ?? 0);
                const net = Number(item.quantity) * Number(item.unit_cost);
                const vat = net * vatRate / 100;
                return this.orderItemRepo.create({ purchase_order_id: order.id, product_id: item.product_id, quantity: item.quantity,
                    unit_cost: item.unit_cost, vat_rate: vatRate, net_subtotal: net, vat_amount: vat, subtotal: net + vat });
            });
            await this.orderItemRepo.save(actualItems);
            order.total = actualItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
            await this.orderRepo.save(order);
            order.items = actualItems;
        }
        await this.orderRepo.manager.transaction(async (manager) => {
            for (const item of order.items) {
                let inventory = await manager.findOne(inventory_entity_1.Inventory, { where: { product_id: item.product_id, branch_id: order.branch_id, tenant_id: tenantId } });
                if (!inventory) {
                    const product = await manager.findOne(product_entity_1.Product, { where: { id: item.product_id, tenant_id: tenantId } });
                    if (!product)
                        throw new common_1.NotFoundException(`Producto ${item.product_id} no encontrado`);
                    inventory = manager.create(inventory_entity_1.Inventory, { tenant_id: tenantId, product_id: item.product_id, branch_id: order.branch_id, stock_quantity: 0, min_stock_alert: product.min_stock_alert });
                    await manager.save(inventory);
                }
                await manager.update(inventory_entity_1.Inventory, inventory.id, {
                    stock_quantity: Number(inventory.stock_quantity) + Number(item.quantity),
                    last_restock_date: new Date(),
                });
                await manager.update(product_entity_1.Product, { id: item.product_id, tenant_id: tenantId }, { cost_price: Number(item.unit_cost) });
            }
            order.status = purchase_order_entity_1.PurchaseOrderStatus.RECEIVED;
            await manager.save(order);
        });
        this.eventEmitter.emit('purchase.received', new purchase_received_event_1.PurchaseReceivedEvent(tenantId, order.id, Number(order.total), order.branch_id, order.items.reduce((sum, item) => sum + Number(item.net_subtotal || item.subtotal), 0), order.items.reduce((sum, item) => sum + Number(item.vat_amount || 0), 0)));
        return order;
    }
    async listPayments(orderId, tenantId) {
        await this.findOneOrder(orderId, tenantId);
        return this.paymentRepo.find({ where: { purchase_order_id: orderId, tenant_id: tenantId }, order: { created_at: 'DESC' } });
    }
    async createPayment(orderId, dto, tenantId) {
        const order = await this.findOneOrder(orderId, tenantId);
        if (order.status !== purchase_order_entity_1.PurchaseOrderStatus.RECEIVED)
            throw new common_1.BadRequestException('La orden debe estar recibida antes de registrar un pago');
        const paid = await this.paymentRepo.createQueryBuilder('payment')
            .select('COALESCE(SUM(payment.amount), 0)', 'total').where('payment.purchase_order_id = :orderId AND payment.tenant_id = :tenantId', { orderId, tenantId }).getRawOne();
        const remaining = Number(order.total) - Number(paid?.total || 0);
        if (Number(dto.amount) > remaining + 0.01)
            throw new common_1.BadRequestException(`El pago excede el saldo pendiente de $${remaining.toFixed(2)}`);
        const paymentEntity = this.paymentRepo.create({ tenant_id: tenantId, purchase_order_id: order.id, supplier_id: order.supplier_id, amount: dto.amount, payment_method: dto.payment_method, notes: dto.notes || null });
        const payment = await this.paymentRepo.save(paymentEntity);
        this.eventEmitter.emit('purchase.payment.created', new purchase_payment_created_event_1.PurchasePaymentCreatedEvent(tenantId, payment.id, order.id, Number(payment.amount), payment.payment_method));
        return payment;
    }
    async createReturn(orderId, dto, tenantId) {
        const order = await this.findOneOrder(orderId, tenantId);
        if (order.status !== purchase_order_entity_1.PurchaseOrderStatus.RECEIVED)
            throw new common_1.BadRequestException('Solo se puede devolver mercadería de una orden recibida');
        const previous = await this.purchaseReturnItemRepo.createQueryBuilder('item')
            .innerJoin('item.purchase_return', 'purchaseReturn')
            .select('item.product_id', 'productId')
            .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
            .where('purchaseReturn.purchase_order_id = :orderId AND purchaseReturn.tenant_id = :tenantId', { orderId, tenantId })
            .groupBy('item.product_id')
            .getRawMany();
        const returnedByProduct = new Map(previous.map((row) => [row.productId, Number(row.quantity)]));
        const orderLines = new Map(order.items.map((item) => [item.product_id, item]));
        const seen = new Set();
        const returnLines = dto.items.map((requested) => {
            if (seen.has(requested.product_id))
                throw new common_1.BadRequestException('No repitas el mismo producto en una devolución');
            seen.add(requested.product_id);
            const line = orderLines.get(requested.product_id);
            if (!line)
                throw new common_1.BadRequestException('El producto no pertenece a la recepción de esta orden');
            const available = Number(line.quantity) - (returnedByProduct.get(requested.product_id) || 0);
            if (Number(requested.quantity) > available + 0.0001)
                throw new common_1.BadRequestException(`La devolución supera la cantidad disponible de ${line.product?.name || requested.product_id}`);
            const net = Number(requested.quantity) * Number(line.unit_cost);
            const vat = net * Number(line.vat_rate || 0) / 100;
            return { requested, line, net, vat, subtotal: net + vat };
        });
        const total = returnLines.reduce((sum, item) => sum + item.subtotal, 0);
        const netAmount = returnLines.reduce((sum, item) => sum + item.net, 0);
        const vatAmount = returnLines.reduce((sum, item) => sum + item.vat, 0);
        const settlementMethod = dto.settlement_method;
        const refundAmount = dto.settlement_method === 'credit_note' ? 0 : total;
        const result = await this.purchaseReturnRepo.manager.transaction(async (manager) => {
            for (const item of returnLines) {
                const inventory = await manager.findOne(inventory_entity_1.Inventory, { where: { product_id: item.requested.product_id, branch_id: order.branch_id, tenant_id: tenantId } });
                if (!inventory || Number(inventory.stock_quantity) < Number(item.requested.quantity)) {
                    throw new common_1.BadRequestException(`Stock insuficiente para devolver ${item.line.product?.name || item.requested.product_id}`);
                }
                await manager.update(inventory_entity_1.Inventory, inventory.id, { stock_quantity: Number(inventory.stock_quantity) - Number(item.requested.quantity) });
            }
            const purchaseReturn = manager.create(purchase_return_entity_1.PurchaseReturn, {
                tenant_id: tenantId, purchase_order_id: order.id, supplier_id: order.supplier_id, branch_id: order.branch_id,
                total, net_amount: netAmount, vat_amount: vatAmount, reason: dto.reason,
                settlement_method: settlementMethod, refund_amount: refundAmount,
            });
            const savedReturn = await manager.save(purchaseReturn);
            const items = returnLines.map((item) => manager.create(purchase_return_item_entity_1.PurchaseReturnItem, {
                tenant_id: tenantId, purchase_return_id: savedReturn.id, product_id: item.requested.product_id,
                quantity: item.requested.quantity, unit_cost: item.line.unit_cost, vat_rate: item.line.vat_rate || 0,
                net_subtotal: item.net, vat_amount: item.vat, subtotal: item.subtotal,
            }));
            await manager.save(items);
            return savedReturn;
        });
        this.eventEmitter.emit('purchase.returned', new purchase_returned_event_1.PurchaseReturnedEvent(tenantId, result.id, order.id, total, netAmount, vatAmount, order.branch_id, dto.settlement_method, refundAmount));
        return this.purchaseReturnRepo.findOne({ where: { id: result.id, tenant_id: tenantId }, relations: ['items'] });
    }
    async getSupplierAccount(id, tenantId) {
        const supplier = await this.findOneSupplier(id, tenantId);
        if (!supplier.current_account_enabled)
            throw new common_1.BadRequestException('La cuenta corriente no está habilitada para este proveedor');
        const [orders, payments, returns] = await Promise.all([
            this.orderRepo.find({ where: { supplier_id: id, tenant_id: tenantId, status: purchase_order_entity_1.PurchaseOrderStatus.RECEIVED }, order: { created_at: 'ASC' } }),
            this.paymentRepo.find({ where: { supplier_id: id, tenant_id: tenantId }, order: { created_at: 'ASC' } }),
            this.purchaseReturnRepo.find({ where: { supplier_id: id, tenant_id: tenantId }, order: { created_at: 'ASC' } }),
        ]);
        const entries = [
            ...(Number(supplier.opening_balance || 0) > 0 ? [{
                    id: `opening-${supplier.id}`,
                    date: supplier.created_at,
                    type: 'opening_balance',
                    description: 'Saldo inicial de cuenta corriente',
                    amount: Number(supplier.opening_balance),
                    direction: 'credit',
                }] : []),
            ...orders.map((order) => ({ id: order.id, date: order.created_at, type: 'purchase', description: 'Compra recibida', amount: Number(order.total), direction: 'credit' })),
            ...payments.map((payment) => ({ id: payment.id, date: payment.created_at, type: 'payment', description: 'Pago a proveedor', amount: Number(payment.amount), direction: 'debit' })),
            ...returns.map((returned) => ({ id: returned.id, date: returned.created_at, type: 'return', description: 'Devolución / nota de crédito', amount: Number(returned.total), direction: 'debit' })),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const balance = Number(supplier.opening_balance || 0) + orders.reduce((sum, order) => sum + Number(order.total), 0) - payments.reduce((sum, payment) => sum + Number(payment.amount), 0) - returns.reduce((sum, returned) => sum + Number(returned.total), 0) + returns.reduce((sum, returned) => sum + Number(returned.refund_amount), 0);
        return { supplier, balance, entries };
    }
    async findSupplierAccounts(query, tenantId) {
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const qb = this.supplierRepo.createQueryBuilder('supplier')
            .where('supplier.tenant_id = :tenantId', { tenantId })
            .andWhere('supplier.current_account_enabled = :enabled', { enabled: true })
            .orderBy('supplier.name', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);
        if (query.search?.trim()) {
            qb.andWhere('(supplier.name LIKE :search OR supplier.phone LIKE :search OR supplier.email LIKE :search)', {
                search: `%${query.search.trim()}%`,
            });
        }
        const [suppliers, total] = await qb.getManyAndCount();
        const data = await Promise.all(suppliers.map(async (supplier) => {
            const account = await this.getSupplierAccount(supplier.id, tenantId);
            return {
                id: supplier.id,
                name: supplier.name,
                phone: supplier.phone,
                email: supplier.email,
                balance: account.balance,
                account_type: 'supplier',
            };
        }));
        return { data, total, page, limit };
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
    __param(3, (0, typeorm_1.InjectRepository)(purchase_payment_entity_1.PurchasePayment)),
    __param(4, (0, typeorm_1.InjectRepository)(purchase_return_entity_1.PurchaseReturn)),
    __param(5, (0, typeorm_1.InjectRepository)(purchase_return_item_entity_1.PurchaseReturnItem)),
    __param(6, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inventory_service_1.InventoryService,
        event_emitter_1.EventEmitter2])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map