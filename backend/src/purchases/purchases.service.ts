import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchasePayment, PurchasePaymentMethod } from './entities/purchase-payment.entity';

import { CreateSupplierDto, UpdateSupplierDto, CreatePurchaseOrderDto, CreatePurchasePaymentDto } from './dto/purchases.dto';
import { PurchaseReceivedEvent } from './events/purchase-received.event';
import { InventoryService } from '../inventory/inventory.service';
import { PurchasePaymentCreatedEvent } from './events/purchase-payment-created.event';

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
    const orders = await this.orderRepo.find({
      where: { tenant_id: tenantId },
      relations: ['supplier', 'items'],
      order: { created_at: 'DESC' },
    });
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
    const order = await this.orderRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['supplier', 'items'],
    });
    if (!order) throw new NotFoundException('Orden de compra no encontrada');
    return order;
  }

  async createOrder(dto: CreatePurchaseOrderDto, tenantId: string): Promise<PurchaseOrder> {
    // 1. Validar propiedad del proveedor y sucursal
    await this.findOneSupplier(dto.supplier_id, tenantId);
    await this.inventoryService.findOneBranch(dto.branch_id, tenantId);

    // 2. Validar propiedad de cada producto antes de crear los ítems
    for (const item of dto.items) {
      await this.inventoryService.findOneProduct(item.product_id, tenantId);
    }

    const total = dto.items.reduce((acc, item) => acc + Number(item.quantity) * Number(item.unit_cost), 0);

    const order = this.orderRepo.create({
      tenant_id: tenantId,
      supplier_id: dto.supplier_id,
      branch_id: dto.branch_id,
      total,
      status: PurchaseOrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepo.save(order);

    const items = dto.items.map((item) =>
      this.orderItemRepo.create({
        purchase_order_id: savedOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        subtotal: Number(item.quantity) * Number(item.unit_cost),
      })
    );

    await this.orderItemRepo.save(items);

    return this.findOneOrder(savedOrder.id, tenantId);
  }

  async receiveOrder(id: string, tenantId: string): Promise<PurchaseOrder> {
    const order = await this.findOneOrder(id, tenantId);

    if (order.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('Esta orden ya fue recibida');
    }

    if (order.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException('Esta orden está cancelada');
    }

    // 1. Ingresar stock al inventario
    for (const item of order.items) {
      await this.inventoryService.addStock(
        { branch_id: order.branch_id, quantity: item.quantity },
        item.product_id,
        tenantId,
      );
    }

    // 2. Marcar como recibida
    order.status = PurchaseOrderStatus.RECEIVED;
    await this.orderRepo.save(order);

    // 3. Emitir evento para contabilidad
    this.eventEmitter.emit(
      'purchase.received',
      new PurchaseReceivedEvent(tenantId, order.id, order.total, order.branch_id),
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

  async cancelOrder(id: string, tenantId: string): Promise<PurchaseOrder> {
    const order = await this.findOneOrder(id, tenantId);

    if (order.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('No se puede cancelar una orden ya recibida');
    }

    order.status = PurchaseOrderStatus.CANCELLED;
    return this.orderRepo.save(order);
  }
}
