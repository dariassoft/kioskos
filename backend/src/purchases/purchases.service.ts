import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchasePayment, PurchasePaymentMethod } from './entities/purchase-payment.entity';
import { PurchaseReturn, PurchaseReturnSettlementMethod } from './entities/purchase-return.entity';
import { PurchaseReturnItem } from './entities/purchase-return-item.entity';
import { Product } from '../inventory/entities/product.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  CreatePurchasePaymentDto,
  CreatePurchaseReturnDto,
  SupplierCurrentAccountsQueryDto,
} from './dto/purchases.dto';
import { PurchaseReceivedEvent } from './events/purchase-received.event';
import { InventoryService } from '../inventory/inventory.service';
import { PurchasePaymentCreatedEvent } from './events/purchase-payment-created.event';
import { PurchaseReturnedEvent } from './events/purchase-returned.event';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(PurchaseOrder)
    private readonly orderRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly orderItemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(PurchasePayment)
  private readonly paymentRepo: Repository<PurchasePayment>,
    @InjectRepository(PurchaseReturn)
    private readonly purchaseReturnRepo: Repository<PurchaseReturn>,
    @InjectRepository(PurchaseReturnItem)
    private readonly purchaseReturnItemRepo: Repository<PurchaseReturnItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================
  // PROVEEDORES
  // ==========================================

  async findAllSuppliers(tenantId: string): Promise<Supplier[]> {
    return this.supplierRepo.find({
      where: { tenant_id: tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOneSupplier(id: string, tenantId: string): Promise<Supplier> {
    const supplier = await this.supplierRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async createSupplier(dto: CreateSupplierDto, tenantId: string): Promise<Supplier> {
    const supplier = this.supplierRepo.create({ ...dto, tenant_id: tenantId });
    return this.supplierRepo.save(supplier);
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto, tenantId: string): Promise<Supplier> {
    await this.findOneSupplier(id, tenantId);
    await this.supplierRepo.update({ id, tenant_id: tenantId }, dto as any);
    return this.findOneSupplier(id, tenantId);
  }

  async removeSupplier(id: string, tenantId: string): Promise<void> {
    const supplier = await this.findOneSupplier(id, tenantId);
    await this.supplierRepo.remove(supplier);
  }

  // ==========================================
  // ORDENES DE COMPRA
  // ==========================================

  async findAllOrders(tenantId: string): Promise<PurchaseOrder[]> {
    const orders = await this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.supplier', 'supplier', 'supplier.tenant_id = :tenantId')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product', 'product.tenant_id = :tenantId')
      .where('order.tenant_id = :tenantId', { tenantId })
      .orderBy('order.created_at', 'DESC')
      .getMany();
    const payments = await this.paymentRepo.createQueryBuilder('payment')
      .select('payment.purchase_order_id', 'orderId')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'paidAmount')
      .where('payment.tenant_id = :tenantId', { tenantId })
      .groupBy('payment.purchase_order_id')
      .getRawMany<{ orderId: string; paidAmount: string }>();
    const paidByOrder = new Map(payments.map((payment) => [payment.orderId, Number(payment.paidAmount)]));
    return orders.map((order) => ({
      ...order,
      paid_amount: paidByOrder.get(order.id) || 0,
      payment_status: Number(paidByOrder.get(order.id) || 0) >= Number(order.total) - 0.01 ? 'paid' : 'pending',
    })) as PurchaseOrder[];
  }

  async findOneOrder(id: string, tenantId: string): Promise<PurchaseOrder> {
    const order = await this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.supplier', 'supplier', 'supplier.tenant_id = :tenantId')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product', 'product.tenant_id = :tenantId')
      .where('order.id = :id AND order.tenant_id = :tenantId', { id, tenantId })
      .getOne();
    if (!order) throw new NotFoundException('Orden de compra no encontrada');
    return order;
  }

  async createOrder(dto: CreatePurchaseOrderDto, tenantId: string): Promise<PurchaseOrder> {
    // 1. Validar propiedad del proveedor y sucursal
    await this.findOneSupplier(dto.supplier_id, tenantId);
    await this.inventoryService.findOneBranch(dto.branch_id, tenantId);

    // 2. Validar propiedad de cada producto antes de crear los ítems
    const products = new Map<string, Product>();
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
      status: PurchaseOrderStatus.PENDING,
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

  async updateOrder(id: string, dto: UpdatePurchaseOrderDto, tenantId: string): Promise<PurchaseOrder> {
    const order = await this.findOneOrder(id, tenantId);
    if (order.status !== PurchaseOrderStatus.PENDING) {
      throw new BadRequestException('Solo se puede editar una orden que todavía no fue recibida o cancelada');
    }
    await this.findOneSupplier(dto.supplier_id, tenantId);
    await this.inventoryService.findOneBranch(dto.branch_id, tenantId);
    const products = new Map<string, Product>();
    for (const item of dto.items) products.set(item.product_id, await this.inventoryService.findOneProduct(item.product_id, tenantId));

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

  async receiveOrder(id: string, tenantId: string, dto?: ReceivePurchaseOrderDto): Promise<PurchaseOrder> {
    const order = await this.findOneOrder(id, tenantId);

    if (order.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('Esta orden ya fue recibida');
    }

    if (order.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException('Esta orden está cancelada');
    }

    // La recepción permite reemplazar las cantidades previstas por las realmente entregadas.
    // Así se pueden agregar productos extra y dejar en cero los que el proveedor no trajo.
    if (dto?.items?.length) {
      const products = new Map<string, Product>();
      for (const item of dto.items) products.set(item.product_id, await this.inventoryService.findOneProduct(item.product_id, tenantId));
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

    // 1. Ingresar stock, actualizar costos y marcar la recepción en una única
    // transacción: nunca debe quedar stock recibido sin orden registrada.
    await this.orderRepo.manager.transaction(async (manager: EntityManager) => {
      for (const item of order.items) {
        let inventory = await manager.findOne(Inventory, { where: { product_id: item.product_id, branch_id: order.branch_id, tenant_id: tenantId } });
        if (!inventory) {
          const product = await manager.findOne(Product, { where: { id: item.product_id, tenant_id: tenantId } });
          if (!product) throw new NotFoundException(`Producto ${item.product_id} no encontrado`);
          inventory = manager.create(Inventory, { tenant_id: tenantId, product_id: item.product_id, branch_id: order.branch_id, stock_quantity: 0, min_stock_alert: product.min_stock_alert });
          await manager.save(inventory);
        }
        await manager.update(Inventory, inventory.id, {
          stock_quantity: Number(inventory.stock_quantity) + Number(item.quantity),
          last_restock_date: new Date(),
        });
        await manager.update(Product, { id: item.product_id, tenant_id: tenantId }, { cost_price: Number(item.unit_cost) });
      }
      order.status = PurchaseOrderStatus.RECEIVED;
      await manager.save(order);
    });

    // 3. Emitir evento para contabilidad
    this.eventEmitter.emit(
      'purchase.received',
      new PurchaseReceivedEvent(
        tenantId,
        order.id,
        Number(order.total),
        order.branch_id,
        order.items.reduce((sum, item) => sum + Number(item.net_subtotal || item.subtotal), 0),
        order.items.reduce((sum, item) => sum + Number(item.vat_amount || 0), 0),
      ),
    );

    return order;
  }

  async listPayments(orderId: string, tenantId: string): Promise<PurchasePayment[]> {
    await this.findOneOrder(orderId, tenantId);
    return this.paymentRepo.find({ where: { purchase_order_id: orderId, tenant_id: tenantId }, order: { created_at: 'DESC' } });
  }

  async createPayment(orderId: string, dto: CreatePurchasePaymentDto, tenantId: string): Promise<PurchasePayment> {
    const order = await this.findOneOrder(orderId, tenantId);
    if (order.status !== PurchaseOrderStatus.RECEIVED) throw new BadRequestException('La orden debe estar recibida antes de registrar un pago');
    const paid = await this.paymentRepo.createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total').where('payment.purchase_order_id = :orderId AND payment.tenant_id = :tenantId', { orderId, tenantId }).getRawOne<{ total: string }>();
    const remaining = Number(order.total) - Number(paid?.total || 0);
    if (Number(dto.amount) > remaining + 0.01) throw new BadRequestException(`El pago excede el saldo pendiente de $${remaining.toFixed(2)}`);
    const paymentEntity = this.paymentRepo.create({ tenant_id: tenantId, purchase_order_id: order.id, supplier_id: order.supplier_id, amount: dto.amount, payment_method: dto.payment_method as PurchasePaymentMethod, notes: dto.notes || null });
    const payment = await this.paymentRepo.save(paymentEntity);
    this.eventEmitter.emit('purchase.payment.created', new PurchasePaymentCreatedEvent(tenantId, payment.id, order.id, Number(payment.amount), payment.payment_method));
    return payment;
  }

  async createReturn(orderId: string, dto: CreatePurchaseReturnDto, tenantId: string): Promise<PurchaseReturn> {
    const order = await this.findOneOrder(orderId, tenantId);
    if (order.status !== PurchaseOrderStatus.RECEIVED) throw new BadRequestException('Solo se puede devolver mercadería de una orden recibida');

    const previous = await this.purchaseReturnItemRepo.createQueryBuilder('item')
      .innerJoin('item.purchase_return', 'purchaseReturn')
      .select('item.product_id', 'productId')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
      .where('purchaseReturn.purchase_order_id = :orderId AND purchaseReturn.tenant_id = :tenantId', { orderId, tenantId })
      .groupBy('item.product_id')
      .getRawMany<{ productId: string; quantity: string }>();
    const returnedByProduct = new Map(previous.map((row) => [row.productId, Number(row.quantity)]));
    const orderLines = new Map(order.items.map((item) => [item.product_id, item]));
    const seen = new Set<string>();
    const returnLines = dto.items.map((requested) => {
      if (seen.has(requested.product_id)) throw new BadRequestException('No repitas el mismo producto en una devolución');
      seen.add(requested.product_id);
      const line = orderLines.get(requested.product_id);
      if (!line) throw new BadRequestException('El producto no pertenece a la recepción de esta orden');
      const available = Number(line.quantity) - (returnedByProduct.get(requested.product_id) || 0);
      if (Number(requested.quantity) > available + 0.0001) throw new BadRequestException(`La devolución supera la cantidad disponible de ${line.product?.name || requested.product_id}`);
      const net = Number(requested.quantity) * Number(line.unit_cost);
      const vat = net * Number(line.vat_rate || 0) / 100;
      return { requested, line, net, vat, subtotal: net + vat };
    });
    const total = returnLines.reduce((sum, item) => sum + item.subtotal, 0);
    const netAmount = returnLines.reduce((sum, item) => sum + item.net, 0);
    const vatAmount = returnLines.reduce((sum, item) => sum + item.vat, 0);
    const settlementMethod = dto.settlement_method as unknown as PurchaseReturnSettlementMethod;
    const refundAmount = dto.settlement_method === 'credit_note' ? 0 : total;

    const result = await this.purchaseReturnRepo.manager.transaction(async (manager: EntityManager) => {
      for (const item of returnLines) {
        const inventory = await manager.findOne(Inventory, { where: { product_id: item.requested.product_id, branch_id: order.branch_id, tenant_id: tenantId } });
        if (!inventory || Number(inventory.stock_quantity) < Number(item.requested.quantity)) {
          throw new BadRequestException(`Stock insuficiente para devolver ${item.line.product?.name || item.requested.product_id}`);
        }
        await manager.update(Inventory, inventory.id, { stock_quantity: Number(inventory.stock_quantity) - Number(item.requested.quantity) });
      }
      const purchaseReturn = manager.create(PurchaseReturn, {
        tenant_id: tenantId, purchase_order_id: order.id, supplier_id: order.supplier_id, branch_id: order.branch_id,
        total, net_amount: netAmount, vat_amount: vatAmount, reason: dto.reason,
        settlement_method: settlementMethod, refund_amount: refundAmount,
      });
      const savedReturn = await manager.save(purchaseReturn);
      const items = returnLines.map((item) => manager.create(PurchaseReturnItem, {
        tenant_id: tenantId, purchase_return_id: savedReturn.id, product_id: item.requested.product_id,
        quantity: item.requested.quantity, unit_cost: item.line.unit_cost, vat_rate: item.line.vat_rate || 0,
        net_subtotal: item.net, vat_amount: item.vat, subtotal: item.subtotal,
      }));
      await manager.save(items);
      return savedReturn;
    });
    this.eventEmitter.emit('purchase.returned', new PurchaseReturnedEvent(tenantId, result.id, order.id, total, netAmount, vatAmount, order.branch_id, dto.settlement_method, refundAmount));
    return this.purchaseReturnRepo.findOne({ where: { id: result.id, tenant_id: tenantId }, relations: ['items'] }) as Promise<PurchaseReturn>;
  }

  async getSupplierAccount(id: string, tenantId: string) {
    const supplier = await this.findOneSupplier(id, tenantId);
    if (!supplier.current_account_enabled) throw new BadRequestException('La cuenta corriente no está habilitada para este proveedor');
    const [orders, payments, returns] = await Promise.all([
      this.orderRepo.find({ where: { supplier_id: id, tenant_id: tenantId, status: PurchaseOrderStatus.RECEIVED }, order: { created_at: 'ASC' } }),
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
        direction: 'credit' as const,
      }] : []),
      ...orders.map((order) => ({ id: order.id, date: order.created_at, type: 'purchase', description: 'Compra recibida', amount: Number(order.total), direction: 'credit' })),
      ...payments.map((payment) => ({ id: payment.id, date: payment.created_at, type: 'payment', description: 'Pago a proveedor', amount: Number(payment.amount), direction: 'debit' })),
      ...returns.map((returned) => ({ id: returned.id, date: returned.created_at, type: 'return', description: 'Devolución / nota de crédito', amount: Number(returned.total), direction: 'debit' })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const balance = Number(supplier.opening_balance || 0) + orders.reduce((sum, order) => sum + Number(order.total), 0) - payments.reduce((sum, payment) => sum + Number(payment.amount), 0) - returns.reduce((sum, returned) => sum + Number(returned.total), 0) + returns.reduce((sum, returned) => sum + Number(returned.refund_amount), 0);
    return { supplier, balance, entries };
  }

  async findSupplierAccounts(query: SupplierCurrentAccountsQueryDto, tenantId: string) {
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
        account_type: 'supplier' as const,
      };
    }));

    return { data, total, page, limit };
  }

  async cancelOrder(id: string, tenantId: string): Promise<PurchaseOrder> {
    const order = await this.findOneOrder(id, tenantId);

    if (order.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('No se puede cancelar una orden ya recibida');
    }

    order.status = PurchaseOrderStatus.CANCELLED;
    return this.orderRepo.save(order);
  }
}
