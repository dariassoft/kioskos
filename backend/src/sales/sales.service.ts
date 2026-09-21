import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Sale, PaymentMethod, PaymentStatus, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleReturn } from './entities/sale-return.entity';
import { SaleReturnItem } from './entities/sale-return-item.entity';
import { CashRegister } from './entities/cash-register.entity';
import { Customer } from './entities/customer.entity';
import { PaymentAccount } from './entities/payment-account.entity';
import { Branch } from '@inventory/entities/branch.entity';
import { Inventory } from '@inventory/entities/inventory.entity';

import {
  CreateSaleDto,
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  ListSalesQueryDto,
  CreateSaleReturnDto,
} from './dto/sales.dto';

import { CreatePaymentAccountDto, UpdatePaymentAccountDto } from './dto/payment-account.dto';

import { InventoryService } from '@inventory/inventory.service';
import { ElectronicInvoicingService } from '@electronic-invoicing/electronic-invoicing.service';
import { SaleCompletedEvent } from '@sales/events/sale-completed.event';
import { SaleReturnedEvent } from '@sales/events/sale-returned.event';

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
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(PaymentAccount)
    private readonly paymentAccountRepo: Repository<PaymentAccount>,
    @InjectRepository(SaleReturn)
    private readonly saleReturnRepo: Repository<SaleReturn>,
    @InjectRepository(SaleReturnItem)
    private readonly saleReturnItemRepo: Repository<SaleReturnItem>,
    private readonly inventoryService: InventoryService,
    private readonly electronicInvoicingService: ElectronicInvoicingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================
  // CAJA REGISTRADORA
  // ==========================================

  async openCashRegister(dto: OpenCashRegisterDto, tenantId: string, userId: string): Promise<CashRegister> {
    await this.assertBranchExists(dto.branch_id, tenantId);

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
    await this.assertBranchExists(branchId, tenantId);

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
    if (!branchId) return null;
    return this.cashRegisterRepo.findOne({
      where: {
        branch_id: branchId,
        user_id: userId,
        status: 'open',
        tenant_id: tenantId,
      },
    });
  }

  /**
   * Marca una venta como verificada (para transferencias pendientes).
   * Solo el admin/manager puede verificar pagos.
   */
  async verifySale(id: string, tenantId: string): Promise<Sale> {
    const sale = await this.saleRepo.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.payment_status === PaymentStatus.CONFIRMED) {
      // La verificación puede repetirse después de crear una venta confirmada
      // (por ejemplo, al subir un comprobante). Devolver la venta evita que
      // un reintento válido termine mostrando un error al cajero.
      return sale;
    }

    sale.payment_status = PaymentStatus.CONFIRMED;
    sale.payment_verified_at = new Date();

    return this.saleRepo.save(sale);
  }

  /**
   * Revierte el pago de una venta a PENDING.
   * Solo para administrativos/admins que no logran identificar el pago.
   */
  async revertSalePayment(saleId: string, tenantId: string): Promise<Sale> {
    const sale = await this.saleRepo.findOne({
      where: { id: saleId, tenant_id: tenantId },
    });

    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (!sale.payment_verified_at) throw new BadRequestException('Esta venta no está verificada');

    sale.payment_status = PaymentStatus.PENDING;
    sale.payment_verified_at = null;
    // La venta sigue existiendo pero su estado de pago vuelve a pendiente
    
    return this.saleRepo.save(sale);
  }

  /**
   * Registra la imagen del comprobante de transferencia.
   */
  async uploadVoucher(saleId: string, imageUrl: string, tenantId: string): Promise<Sale> {
    const sale = await this.saleRepo.findOne({
      where: { id: saleId, tenant_id: tenantId },
    });

    if (!sale) throw new NotFoundException('Venta no encontrada');

    sale.voucher_image_url = imageUrl;
    return this.saleRepo.save(sale);
  }

  // ==========================================
  // VENTAS (POS)
  // ==========================================

  async createSale(dto: CreateSaleDto, tenantId: string, userId: string): Promise<Sale> {
    // 1. Validar propiedad de la sucursal
    await this.assertBranchExists(dto.branch_id, tenantId);

    // 2. Validar propiedad de cada producto antes de procesar la venta
    const products = new Map<string, Awaited<ReturnType<InventoryService['findOneProduct']>>>();
    for (const item of dto.items) products.set(item.product_id, await this.inventoryService.findOneProduct(item.product_id, tenantId));

    // 3. Validar que la caja esté abierta
    const activeRegister = await this.getActiveRegister(tenantId, dto.branch_id, userId);
    if (!activeRegister) {
      throw new BadRequestException('Debes abrir la caja antes de registrar una venta');
    }

    let customer: Customer | null = null;
    if (dto.customer_id) {
       customer = await this.findOneCustomer(dto.customer_id, tenantId);
    }

    // 4. Procesar pago condicionado a Fiado
    if (dto.payment_method === PaymentMethod.CREDIT_CLIENT) {
      if (!customer) {
        throw new BadRequestException('Debes seleccionar un cliente válido para venderle al fiado');
      }
    }

    const total = dto.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);
    const netAmount = dto.items.reduce((acc, item) => {
      const rate = Number(products.get(item.product_id)?.vat_rate || 0);
      const gross = Number(item.quantity) * Number(item.unit_price);
      return acc + (rate > 0 ? gross / (1 + rate / 100) : gross);
    }, 0);
    const vatAmount = total - netAmount;

    const paymentStatus = this.resolvePaymentStatus(dto.payment_method, dto.payment_status, dto.payment_details?.mp_payment_status);

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
      payment_status: paymentStatus,
      total: total,
      status: SaleStatus.COMPLETED,
      // Agregar detalles de pago si están presentes
      mp_payment_id: dto.payment_details?.mp_payment_id || null,
      mp_payment_status: dto.payment_details?.mp_payment_status || null,
      payer_name: dto.payment_details?.payer_name || null,
      payer_email: dto.payment_details?.payer_email || null,
      transfer_voucher: dto.payment_details?.transfer_voucher || null,
      transfer_origin: dto.payment_details?.transfer_origin || null,
      card_last_digits: dto.payment_details?.card_last_digits || null,
      card_brand: dto.payment_details?.card_brand || null,
      authorization_code: dto.payment_details?.authorization_code || null,
      payment_notes: dto.payment_details?.payment_notes || null,
      payment_verified_at: null,
    });

    const savedSale = await this.saleRepo.save(sale);

    const saleItems = dto.items.map((item) =>
      this.saleItemRepo.create({
        sale_id: savedSale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: Number(item.quantity) * Number(item.unit_price),
        vat_rate: Number(products.get(item.product_id)?.vat_rate || 0),
        net_subtotal: (() => {
          const gross = Number(item.quantity) * Number(item.unit_price);
          const rate = Number(products.get(item.product_id)?.vat_rate || 0);
          return rate > 0 ? gross / (1 + rate / 100) : gross;
        })(),
        vat_amount: (() => {
          const gross = Number(item.quantity) * Number(item.unit_price);
          const rate = Number(products.get(item.product_id)?.vat_rate || 0);
          return rate > 0 ? gross - gross / (1 + rate / 100) : 0;
        })(),
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
      new SaleCompletedEvent(tenantId, savedSale.id, total, dto.payment_method, dto.branch_id, userId, netAmount, vatAmount),
    );

    if (paymentStatus === PaymentStatus.CONFIRMED) {
      await this.verifySale(savedSale.id, tenantId);
    }

    // 9. Si se solicita factura electrónica (ARCA/AFIP)
    if (dto.request_invoice) {
      try {
        await this.electronicInvoicingService.generateInvoice({
          sale_id: savedSale.id,
          concepto: 1, // Productos
          doc_tipo_receptor: dto.invoice_doc_tipo || 99, // Consumidor Final por defecto
          doc_nro_receptor: Number(dto.invoice_doc_nro || 0),
          nombre_receptor: customer?.name || 'Consumidor Final',
          importe_total: total,
          // El desglose de IVA se podría mejorar extrayendo info de los productos
          // Por ahora simplificamos a 21% si no es monotributista (esto lo maneja el service)
        }, tenantId);
      } catch (err) {
        // No bloqueamos la venta si falla la factura, pero logueamos el error
        // En producción se podría reintentar o marcar para emisión manual posterior
        console.error('Error generando factura AFIP:', err);
      }
    }

    return this.saleRepo.findOne({ where: { id: savedSale.id }, relations: ['items', 'customer'] }) as Promise<Sale>;
  }

  async createReturn(saleId: string, dto: CreateSaleReturnDto, tenantId: string): Promise<SaleReturn> {
    const sale = await this.saleRepo.findOne({ where: { id: saleId, tenant_id: tenantId }, relations: ['items', 'customer'] });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.status === SaleStatus.PENDING) throw new BadRequestException('No se puede devolver una venta pendiente');

    const previous = await this.saleReturnItemRepo.createQueryBuilder('item')
      .innerJoin('item.sale_return', 'saleReturn')
      .select('item.product_id', 'productId')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
      .where('saleReturn.sale_id = :saleId AND saleReturn.tenant_id = :tenantId', { saleId, tenantId })
      .groupBy('item.product_id')
      .getRawMany<{ productId: string; quantity: string }>();
    const returnedByProduct = new Map(previous.map((row) => [row.productId, Number(row.quantity)]));
    const saleLines = new Map(sale.items.map((item) => [item.product_id, item]));
    const seen = new Set<string>();
    const returnLines = dto.items.map((requested) => {
      if (seen.has(requested.product_id)) throw new BadRequestException('No repitas el mismo producto en una devolución');
      seen.add(requested.product_id);
      const line = saleLines.get(requested.product_id);
      if (!line) throw new BadRequestException('El producto no pertenece a esta venta');
      const available = Number(line.quantity) - (returnedByProduct.get(requested.product_id) || 0);
      if (Number(requested.quantity) > available + 0.0001) throw new BadRequestException(`La devolución supera la cantidad vendida de ${line.product?.name || requested.product_id}`);
      const gross = Number(requested.quantity) * Number(line.unit_price);
      const rate = Number(line.vat_rate || 0);
      const net = rate > 0 ? gross / (1 + rate / 100) : gross;
      return { requested, line, gross, net, vat: gross - net };
    });
    const total = returnLines.reduce((sum, item) => sum + item.gross, 0);
    const netAmount = returnLines.reduce((sum, item) => sum + item.net, 0);
    const vatAmount = total - netAmount;

    const result = await this.saleReturnRepo.manager.transaction(async (manager: EntityManager) => {
      for (const item of returnLines) {
        const inventory = await manager.findOne(Inventory, { where: { product_id: item.requested.product_id, branch_id: sale.branch_id, tenant_id: tenantId } });
        if (!inventory) throw new BadRequestException('No existe stock registrado para devolver este producto');
        await manager.update(Inventory, inventory.id, { stock_quantity: Number(inventory.stock_quantity) + Number(item.requested.quantity), last_restock_date: new Date() });
      }
      const saleReturn = manager.create(SaleReturn, { tenant_id: tenantId, sale_id: sale.id, branch_id: sale.branch_id, total, net_amount: netAmount, vat_amount: vatAmount, reason: dto.reason });
      const savedReturn = await manager.save(saleReturn);
      const items = returnLines.map((item) => manager.create(SaleReturnItem, {
        tenant_id: tenantId, sale_return_id: savedReturn.id, product_id: item.requested.product_id,
        quantity: item.requested.quantity, unit_price: item.line.unit_price, vat_rate: item.line.vat_rate || 0,
        net_subtotal: item.net, vat_amount: item.vat, subtotal: item.gross,
      }));
      await manager.save(items);
      const previousReturned = Array.from(returnedByProduct.values()).reduce((sum, quantity) => sum + quantity, 0);
      const newReturned = previousReturned + returnLines.reduce((sum, item) => sum + Number(item.requested.quantity), 0);
      const soldQuantity = sale.items.reduce((sum, item) => sum + Number(item.quantity), 0);
      await manager.update(Sale, { id: sale.id, tenant_id: tenantId }, { status: newReturned >= soldQuantity - 0.0001 ? SaleStatus.REFUNDED : SaleStatus.PARTIALLY_REFUNDED });
      if (sale.payment_method === PaymentMethod.CREDIT_CLIENT && sale.customer_id) {
        const customer = await manager.findOne(Customer, { where: { id: sale.customer_id, tenant_id: tenantId } });
        if (customer) await manager.update(Customer, customer.id, { current_debt: Math.max(0, Number(customer.current_debt) - total) });
      }
      return savedReturn;
    });
    this.eventEmitter.emit('sale.returned', new SaleReturnedEvent(tenantId, result.id, sale.id, total, netAmount, vatAmount, sale.branch_id));
    return this.saleReturnRepo.findOne({ where: { id: result.id, tenant_id: tenantId }, relations: ['items'] }) as Promise<SaleReturn>;
  }

  async listSales(
    tenantId: string,
    query: ListSalesQueryDto,
  ): Promise<{ data: Sale[]; total: number; page: number; limit: number }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    
    const qb = this.saleRepo
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('sale.customer', 'customer')
      .where('sale.tenant_id = :tenantId', { tenantId });

    if (query.payment_status) {
      qb.andWhere('sale.payment_status = :paymentStatus', { paymentStatus: query.payment_status });
    }

    if (query.branch_id) {
      qb.andWhere('sale.branch_id = :branchId', { branchId: query.branch_id });
    }

    if (query.start_date) {
      // Usar >= para incluir el inicio del día
      qb.andWhere('sale.created_at >= :startDate', { 
        startDate: `${query.start_date} 00:00:00` 
      });
    }

    if (query.end_date) {
      // Usar <= para incluir el final del día
      qb.andWhere('sale.created_at <= :endDate', { 
        endDate: `${query.end_date} 23:59:59` 
      });
    }

    qb.orderBy('sale.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
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

  // ==========================================
  // CUENTAS DE PAGO (Payment Accounts)
  // ==========================================

  async findAllPaymentAccounts(tenantId: string): Promise<PaymentAccount[]> {
    return this.paymentAccountRepo.find({
      where: { tenant_id: tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOnePaymentAccount(id: string, tenantId: string): Promise<PaymentAccount> {
    const account = await this.paymentAccountRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!account) throw new NotFoundException('Cuenta de pago no encontrada');
    return account;
  }

  async createPaymentAccount(dto: CreatePaymentAccountDto, tenantId: string): Promise<PaymentAccount> {
    const account = this.paymentAccountRepo.create({ ...dto, tenant_id: tenantId });
    return this.paymentAccountRepo.save(account);
  }

  async updatePaymentAccount(id: string, dto: UpdatePaymentAccountDto, tenantId: string): Promise<PaymentAccount> {
    const account = await this.findOnePaymentAccount(id, tenantId);
    Object.assign(account, dto);
    return this.paymentAccountRepo.save(account);
  }

  async deletePaymentAccount(id: string, tenantId: string): Promise<{ message: string }> {
    const account = await this.findOnePaymentAccount(id, tenantId);
    await this.paymentAccountRepo.remove(account);
    return { message: 'Cuenta eliminada correctamente' };
  }

  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================

  private async assertBranchExists(branchId: string, tenantId: string): Promise<Branch> {
    const branch = await this.branchRepo.findOne({ where: { id: branchId, tenant_id: tenantId } });
    if (!branch) {
      throw new BadRequestException('La sucursal seleccionada no existe o no pertenece a tu negocio');
    }
    return branch;
  }

  /**
   * Determina si un método de pago debe auto-verificarse inmediatamente.
   * Efectivo, débito, crédito y fiado se verifican al momento.
   * Transferencias/QR/links de MercadoPago requieren verificación manual.
   */
  private shouldAutoVerify(paymentMethod: PaymentMethod): boolean {
    const autoVerifyMethods = [
      PaymentMethod.CASH,
      PaymentMethod.CREDIT_CLIENT,
      PaymentMethod.DEBIT_CARD,
      PaymentMethod.CREDIT_CARD,
    ];
    return autoVerifyMethods.includes(paymentMethod);
  }

  private resolvePaymentStatus(
    paymentMethod: PaymentMethod,
    explicitStatus?: PaymentStatus,
    mpStatus?: string,
  ): PaymentStatus {
    if (explicitStatus) return explicitStatus;
    if (mpStatus) {
      const normalized = mpStatus.toLowerCase();
      if (normalized === 'approved') return PaymentStatus.CONFIRMED;
      if (normalized === 'rejected' || normalized === 'cancelled') return PaymentStatus.FAILED;
      return PaymentStatus.PENDING;
    }
    return this.shouldAutoVerify(paymentMethod) ? PaymentStatus.CONFIRMED : PaymentStatus.PENDING;
  }

}
