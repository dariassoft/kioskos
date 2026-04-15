import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Sale, PaymentMethod, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CashRegister } from './entities/cash-register.entity';
import { Customer } from './entities/customer.entity';

import {
  CreateSaleDto,
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateCustomerDto,
  UpdateCustomerDto,
} from './dto/sales.dto';

import { InventoryService } from '../inventory/inventory.service';
import { SaleCompletedEvent } from './events/sale-completed.event';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepo: Repository<SaleItem>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepo: Repository<CashRegister>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================
  // CAJA REGISTRADORA
  // ==========================================

  async openCashRegister(dto: OpenCashRegisterDto, tenantId: string, userId: string): Promise<CashRegister> {
    const existingOpen = await this.cashRegisterRepo.findOne({
      where: {
        branch_id: dto.branch_id,
        user_id: userId,
        status: 'open',
        tenant_id: tenantId,
      },
    });

    if (existingOpen) {
      throw new BadRequestException('Ya tienes una caja abierta en esta sucursal');
    }

    const register = this.cashRegisterRepo.create({
      tenant_id: tenantId,
      branch_id: dto.branch_id,
      user_id: userId,
      opening_balance: dto.opening_balance,
      status: 'open',
    });

    return this.cashRegisterRepo.save(register);
  }

  async closeCashRegister(
    branchId: string,
    dto: CloseCashRegisterDto,
    tenantId: string,
    userId: string,
  ): Promise<CashRegister> {
    const activeRegister = await this.cashRegisterRepo.findOne({
      where: {
        branch_id: branchId,
        user_id: userId,
        status: 'open',
        tenant_id: tenantId,
      },
    });

    if (!activeRegister) {
      throw new NotFoundException('No tienes ninguna caja abierta en esta sucursal');
    }

    activeRegister.status = 'closed';
    activeRegister.closing_balance = dto.closing_balance;
    activeRegister.closed_at = new Date();

    return this.cashRegisterRepo.save(activeRegister);
  }

  async getActiveRegister(tenantId: string, branchId: string, userId: string): Promise<CashRegister | null> {
    return this.cashRegisterRepo.findOne({
      where: {
        branch_id: branchId,
        user_id: userId,
        status: 'open',
        tenant_id: tenantId,
      },
    });
  }

  // ==========================================
  // VENTAS (POS)
  // ==========================================

  async createSale(dto: CreateSaleDto, tenantId: string, userId: string): Promise<Sale> {
    // 1. Validar que la caja esté abierta
    const activeRegister = await this.getActiveRegister(tenantId, dto.branch_id, userId);
    if (!activeRegister) {
      throw new BadRequestException('Debes abrir la caja antes de registrar una venta');
    }

    let customer: Customer | null = null;

    // 2. Procesar pago condicionado a Fiado
    if (dto.payment_method === PaymentMethod.CREDIT_CLIENT) {
      if (!dto.customer_id) {
        throw new BadRequestException('Debes seleccionar un cliente para venderle al fiado');
      }
      customer = await this.findOneCustomer(dto.customer_id, tenantId);
    }

    // 3. Crear venta y calcular el total
    const total = dto.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);

    // 4. Si es crédito, validar límite de cliente y acumular deuda
    if (dto.payment_method === PaymentMethod.CREDIT_CLIENT && customer) {
      const newDebt = Number(customer.current_debt) + total;
      if (customer.credit_limit > 0 && newDebt > customer.credit_limit) {
        throw new ForbiddenException(`Límite de crédito excedido. Tope: $${customer.credit_limit}, Deuda acumulada: $${newDebt}`);
      }
      await this.customerRepo.update(customer.id, { current_debt: newDebt });
    }

    // 5. Acumular en ventas en efectivo de la caja activa si aplica
    if (dto.payment_method === PaymentMethod.CASH) {
      await this.cashRegisterRepo.update(activeRegister.id, {
        cash_sales: Number(activeRegister.cash_sales) + total,
      });
    }

    // 6. Guardar la venta y sus ítems
    const sale = this.saleRepo.create({
      tenant_id: tenantId,
      branch_id: dto.branch_id,
      user_id: userId,
      customer_id: dto.customer_id,
      payment_method: dto.payment_method,
      total: total,
      status: SaleStatus.COMPLETED,
    });

    const savedSale = await this.saleRepo.save(sale);

    const saleItems = dto.items.map((item) =>
      this.saleItemRepo.create({
        sale_id: savedSale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: Number(item.quantity) * Number(item.unit_price),
      }),
    );

    await this.saleItemRepo.save(saleItems);

    // 7. Reducir el stock iterando (Llamar al InventoryService)
    for (const item of saleItems) {
      await this.inventoryService.reduceStock(
        item.product_id,
        dto.branch_id,
        item.quantity,
        tenantId,
      );
    }

    // 8. Emitir evento para el módulo contable
    this.eventEmitter.emit(
      'sale.completed',
      new SaleCompletedEvent(tenantId, savedSale.id, total, dto.payment_method, dto.branch_id, userId),
    );

    return this.saleRepo.findOne({ where: { id: savedSale.id }, relations: ['items', 'customer'] }) as Promise<Sale>;
  }

  // ==========================================
  // CLIENTES (Customers)
  // ==========================================

  async findAllCustomers(tenantId: string): Promise<Customer[]> {
    return this.customerRepo.find({
      where: { tenant_id: tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOneCustomer(id: string, tenantId: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async createCustomer(dto: CreateCustomerDto, tenantId: string): Promise<Customer> {
    const customer = this.customerRepo.create({ ...dto, tenant_id: tenantId });
    return this.customerRepo.save(customer);
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto, tenantId: string): Promise<Customer> {
    await this.findOneCustomer(id, tenantId); // Validar existencia
    await this.customerRepo.update({ id, tenant_id: tenantId }, dto as any);
    return this.findOneCustomer(id, tenantId);
  }

  // Abono a la deuda de fiados
  async payDebt(id: string, amount: number, tenantId: string): Promise<Customer> {
    const customer = await this.findOneCustomer(id, tenantId);
    if (amount <= 0) throw new BadRequestException('El monto debe ser mayor a 0');
    
    let newDebt = Number(customer.current_debt) - amount;
    if (newDebt < 0) newDebt = 0; // Prevenir deuda negativa para simplificar por ahora

    await this.customerRepo.update({ id, tenant_id: tenantId }, { current_debt: newDebt });
    return this.findOneCustomer(id, tenantId);
  }
}
