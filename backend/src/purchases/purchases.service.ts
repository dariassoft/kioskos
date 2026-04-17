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

import { CreateSupplierDto, UpdateSupplierDto, CreatePurchaseOrderDto } from './dto/purchases.dto';
import { PurchaseReceivedEvent } from './events/purchase-received.event';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(PurchaseOrder)
    private readonly orderRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly orderItemRepo: Repository<PurchaseOrderItem>,
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
    return this.orderRepo.find({
      where: { tenant_id: tenantId },
      relations: ['supplier'],
      order: { created_at: 'DESC' },
    });
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

  async cancelOrder(id: string, tenantId: string): Promise<PurchaseOrder> {
    const order = await this.findOneOrder(id, tenantId);

    if (order.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('No se puede cancelar una orden ya recibida');
    }

    order.status = PurchaseOrderStatus.CANCELLED;
    return this.orderRepo.save(order);
  }
}
