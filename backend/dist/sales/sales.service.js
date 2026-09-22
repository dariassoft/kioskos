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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const sale_entity_1 = require("./entities/sale.entity");
const sale_item_entity_1 = require("./entities/sale-item.entity");
const sale_return_entity_1 = require("./entities/sale-return.entity");
const sale_return_item_entity_1 = require("./entities/sale-return-item.entity");
const cash_register_entity_1 = require("./entities/cash-register.entity");
const customer_entity_1 = require("./entities/customer.entity");
const customer_account_payment_entity_1 = require("./entities/customer-account-payment.entity");
const payment_account_entity_1 = require("./entities/payment-account.entity");
const branch_entity_1 = require("../inventory/entities/branch.entity");
const inventory_entity_1 = require("../inventory/entities/inventory.entity");
const inventory_service_1 = require("../inventory/inventory.service");
const electronic_invoicing_service_1 = require("../electronic-invoicing/electronic-invoicing.service");
const sale_completed_event_1 = require("./events/sale-completed.event");
const sale_returned_event_1 = require("./events/sale-returned.event");
const customer_payment_created_event_1 = require("./events/customer-payment-created.event");
let SalesService = class SalesService {
    constructor(saleRepo, saleItemRepo, cashRegisterRepo, customerRepo, customerPaymentRepo, branchRepo, paymentAccountRepo, saleReturnRepo, saleReturnItemRepo, inventoryService, electronicInvoicingService, eventEmitter) {
        this.saleRepo = saleRepo;
        this.saleItemRepo = saleItemRepo;
        this.cashRegisterRepo = cashRegisterRepo;
        this.customerRepo = customerRepo;
        this.customerPaymentRepo = customerPaymentRepo;
        this.branchRepo = branchRepo;
        this.paymentAccountRepo = paymentAccountRepo;
        this.saleReturnRepo = saleReturnRepo;
        this.saleReturnItemRepo = saleReturnItemRepo;
        this.inventoryService = inventoryService;
        this.electronicInvoicingService = electronicInvoicingService;
        this.eventEmitter = eventEmitter;
    }
    async openCashRegister(dto, tenantId, userId) {
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
            throw new common_1.BadRequestException('Ya tienes una caja abierta en esta sucursal');
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
    async closeCashRegister(branchId, dto, tenantId, userId) {
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
            throw new common_1.NotFoundException('No tienes ninguna caja abierta en esta sucursal');
        }
        activeRegister.status = 'closed';
        activeRegister.closing_balance = dto.closing_balance;
        activeRegister.closed_at = new Date();
        return this.cashRegisterRepo.save(activeRegister);
    }
    async getActiveRegister(tenantId, branchId, userId) {
        if (!branchId)
            return null;
        return this.cashRegisterRepo.findOne({
            where: {
                branch_id: branchId,
                user_id: userId,
                status: 'open',
                tenant_id: tenantId,
            },
        });
    }
    async verifySale(id, tenantId) {
        const sale = await this.saleRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!sale)
            throw new common_1.NotFoundException('Venta no encontrada');
        if (sale.payment_status === sale_entity_1.PaymentStatus.CONFIRMED) {
            return sale;
        }
        sale.payment_status = sale_entity_1.PaymentStatus.CONFIRMED;
        sale.payment_verified_at = new Date();
        return this.saleRepo.save(sale);
    }
    async revertSalePayment(saleId, tenantId) {
        const sale = await this.saleRepo.findOne({
            where: { id: saleId, tenant_id: tenantId },
        });
        if (!sale)
            throw new common_1.NotFoundException('Venta no encontrada');
        if (!sale.payment_verified_at)
            throw new common_1.BadRequestException('Esta venta no está verificada');
        sale.payment_status = sale_entity_1.PaymentStatus.PENDING;
        sale.payment_verified_at = null;
        return this.saleRepo.save(sale);
    }
    async uploadVoucher(saleId, imageUrl, tenantId) {
        const sale = await this.saleRepo.findOne({
            where: { id: saleId, tenant_id: tenantId },
        });
        if (!sale)
            throw new common_1.NotFoundException('Venta no encontrada');
        sale.voucher_image_url = imageUrl;
        return this.saleRepo.save(sale);
    }
    async createSale(dto, tenantId, userId) {
        await this.assertBranchExists(dto.branch_id, tenantId);
        const products = new Map();
        for (const item of dto.items)
            products.set(item.product_id, await this.inventoryService.findOneProduct(item.product_id, tenantId));
        const activeRegister = await this.getActiveRegister(tenantId, dto.branch_id, userId);
        if (!activeRegister) {
            throw new common_1.BadRequestException('Debes abrir la caja antes de registrar una venta');
        }
        let customer = null;
        if (dto.customer_id) {
            customer = await this.findOneCustomer(dto.customer_id, tenantId);
        }
        if (dto.payment_method === sale_entity_1.PaymentMethod.CREDIT_CLIENT) {
            if (!customer) {
                throw new common_1.BadRequestException('Debes seleccionar un cliente válido para venderle al fiado');
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
        if (dto.payment_method === sale_entity_1.PaymentMethod.CREDIT_CLIENT && customer) {
            const newDebt = Number(customer.current_debt) + total;
            if (customer.credit_limit > 0 && newDebt > customer.credit_limit) {
                throw new common_1.ForbiddenException(`Límite de crédito excedido. Tope: $${customer.credit_limit}, Deuda acumulada: $${newDebt}`);
            }
            await this.customerRepo.update({ id: customer.id, tenant_id: tenantId }, { current_debt: newDebt });
        }
        if (dto.payment_method === sale_entity_1.PaymentMethod.CASH) {
            await this.cashRegisterRepo.update({ id: activeRegister.id, tenant_id: tenantId }, {
                cash_sales: Number(activeRegister.cash_sales) + total,
            });
        }
        const sale = this.saleRepo.create({
            tenant_id: tenantId,
            branch_id: dto.branch_id,
            user_id: userId,
            customer_id: dto.customer_id,
            payment_method: dto.payment_method,
            payment_status: paymentStatus,
            total: total,
            status: sale_entity_1.SaleStatus.COMPLETED,
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
        const saleItems = dto.items.map((item) => this.saleItemRepo.create({
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
        }));
        await this.saleItemRepo.save(saleItems);
        for (const item of saleItems) {
            await this.inventoryService.reduceStock(item.product_id, dto.branch_id, item.quantity, tenantId);
        }
        this.eventEmitter.emit('sale.completed', new sale_completed_event_1.SaleCompletedEvent(tenantId, savedSale.id, total, dto.payment_method, dto.branch_id, userId, netAmount, vatAmount));
        if (paymentStatus === sale_entity_1.PaymentStatus.CONFIRMED) {
            await this.verifySale(savedSale.id, tenantId);
        }
        if (dto.request_invoice) {
            try {
                await this.electronicInvoicingService.generateInvoice({
                    sale_id: savedSale.id,
                    concepto: 1,
                    doc_tipo_receptor: dto.invoice_doc_tipo || 99,
                    doc_nro_receptor: Number(dto.invoice_doc_nro || 0),
                    nombre_receptor: customer?.name || 'Consumidor Final',
                    importe_total: total,
                }, tenantId);
            }
            catch (err) {
                console.error('Error generando factura AFIP:', err);
            }
        }
        return this.saleRepo.findOne({ where: { id: savedSale.id, tenant_id: tenantId }, relations: ['items', 'customer'] });
    }
    async createReturn(saleId, dto, tenantId) {
        const sale = await this.saleRepo.findOne({ where: { id: saleId, tenant_id: tenantId }, relations: ['items', 'customer'] });
        if (!sale)
            throw new common_1.NotFoundException('Venta no encontrada');
        if (sale.status === sale_entity_1.SaleStatus.PENDING)
            throw new common_1.BadRequestException('No se puede devolver una venta pendiente');
        const previous = await this.saleReturnItemRepo.createQueryBuilder('item')
            .innerJoin('item.sale_return', 'saleReturn')
            .select('item.product_id', 'productId')
            .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
            .where('saleReturn.sale_id = :saleId AND saleReturn.tenant_id = :tenantId', { saleId, tenantId })
            .groupBy('item.product_id')
            .getRawMany();
        const returnedByProduct = new Map(previous.map((row) => [row.productId, Number(row.quantity)]));
        const saleLines = new Map(sale.items.map((item) => [item.product_id, item]));
        const seen = new Set();
        const returnLines = dto.items.map((requested) => {
            if (seen.has(requested.product_id))
                throw new common_1.BadRequestException('No repitas el mismo producto en una devolución');
            seen.add(requested.product_id);
            const line = saleLines.get(requested.product_id);
            if (!line)
                throw new common_1.BadRequestException('El producto no pertenece a esta venta');
            const available = Number(line.quantity) - (returnedByProduct.get(requested.product_id) || 0);
            if (Number(requested.quantity) > available + 0.0001)
                throw new common_1.BadRequestException(`La devolución supera la cantidad vendida de ${line.product?.name || requested.product_id}`);
            const gross = Number(requested.quantity) * Number(line.unit_price);
            const rate = Number(line.vat_rate || 0);
            const net = rate > 0 ? gross / (1 + rate / 100) : gross;
            return { requested, line, gross, net, vat: gross - net };
        });
        const total = returnLines.reduce((sum, item) => sum + item.gross, 0);
        const netAmount = returnLines.reduce((sum, item) => sum + item.net, 0);
        const vatAmount = total - netAmount;
        const result = await this.saleReturnRepo.manager.transaction(async (manager) => {
            for (const item of returnLines) {
                const inventory = await manager.findOne(inventory_entity_1.Inventory, { where: { product_id: item.requested.product_id, branch_id: sale.branch_id, tenant_id: tenantId } });
                if (!inventory)
                    throw new common_1.BadRequestException('No existe stock registrado para devolver este producto');
                await manager.update(inventory_entity_1.Inventory, inventory.id, { stock_quantity: Number(inventory.stock_quantity) + Number(item.requested.quantity), last_restock_date: new Date() });
            }
            const saleReturn = manager.create(sale_return_entity_1.SaleReturn, { tenant_id: tenantId, sale_id: sale.id, branch_id: sale.branch_id, total, net_amount: netAmount, vat_amount: vatAmount, reason: dto.reason });
            const savedReturn = await manager.save(saleReturn);
            const items = returnLines.map((item) => manager.create(sale_return_item_entity_1.SaleReturnItem, {
                tenant_id: tenantId, sale_return_id: savedReturn.id, product_id: item.requested.product_id,
                quantity: item.requested.quantity, unit_price: item.line.unit_price, vat_rate: item.line.vat_rate || 0,
                net_subtotal: item.net, vat_amount: item.vat, subtotal: item.gross,
            }));
            await manager.save(items);
            const previousReturned = Array.from(returnedByProduct.values()).reduce((sum, quantity) => sum + quantity, 0);
            const newReturned = previousReturned + returnLines.reduce((sum, item) => sum + Number(item.requested.quantity), 0);
            const soldQuantity = sale.items.reduce((sum, item) => sum + Number(item.quantity), 0);
            await manager.update(sale_entity_1.Sale, { id: sale.id, tenant_id: tenantId }, { status: newReturned >= soldQuantity - 0.0001 ? sale_entity_1.SaleStatus.REFUNDED : sale_entity_1.SaleStatus.PARTIALLY_REFUNDED });
            if (sale.payment_method === sale_entity_1.PaymentMethod.CREDIT_CLIENT && sale.customer_id) {
                const customer = await manager.findOne(customer_entity_1.Customer, { where: { id: sale.customer_id, tenant_id: tenantId } });
                if (customer)
                    await manager.update(customer_entity_1.Customer, { id: customer.id, tenant_id: tenantId }, { current_debt: Math.max(0, Number(customer.current_debt) - total) });
            }
            return savedReturn;
        });
        this.eventEmitter.emit('sale.returned', new sale_returned_event_1.SaleReturnedEvent(tenantId, result.id, sale.id, total, netAmount, vatAmount, sale.branch_id));
        return this.saleReturnRepo.findOne({ where: { id: result.id, tenant_id: tenantId }, relations: ['items'] });
    }
    async listSales(tenantId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const qb = this.saleRepo
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.items', 'items')
            .leftJoinAndSelect('sale.customer', 'customer', 'customer.tenant_id = :tenantId')
            .where('sale.tenant_id = :tenantId', { tenantId });
        if (query.payment_status) {
            qb.andWhere('sale.payment_status = :paymentStatus', { paymentStatus: query.payment_status });
        }
        if (query.branch_id) {
            qb.andWhere('sale.branch_id = :branchId', { branchId: query.branch_id });
        }
        if (query.start_date) {
            qb.andWhere('sale.created_at >= :startDate', {
                startDate: `${query.start_date} 00:00:00`
            });
        }
        if (query.end_date) {
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
    async findAllCustomers(tenantId) {
        return this.customerRepo.find({
            where: { tenant_id: tenantId },
            order: { name: 'ASC' },
        });
    }
    async findCustomerAccounts(query, tenantId) {
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const qb = this.customerRepo.createQueryBuilder('customer')
            .where('customer.tenant_id = :tenantId', { tenantId })
            .orderBy('customer.name', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);
        if (query.search?.trim()) {
            qb.andWhere('(customer.name LIKE :search OR customer.phone LIKE :search OR customer.email LIKE :search)', {
                search: `%${query.search.trim()}%`,
            });
        }
        const [customers, total] = await qb.getManyAndCount();
        return {
            data: customers.map((customer) => ({
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                credit_limit: Number(customer.credit_limit),
                balance: Number(customer.current_debt),
                account_type: 'customer',
            })),
            total,
            page,
            limit,
        };
    }
    async findOneCustomer(id, tenantId) {
        const customer = await this.customerRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!customer)
            throw new common_1.NotFoundException('Cliente no encontrado');
        return customer;
    }
    async createCustomer(dto, tenantId) {
        const customer = this.customerRepo.create({ ...dto, tenant_id: tenantId });
        return this.customerRepo.save(customer);
    }
    async updateCustomer(id, dto, tenantId) {
        await this.findOneCustomer(id, tenantId);
        await this.customerRepo.update({ id, tenant_id: tenantId }, dto);
        return this.findOneCustomer(id, tenantId);
    }
    async payDebt(id, dto, tenantId) {
        const amount = Number(dto.amount);
        if (amount <= 0)
            throw new common_1.BadRequestException('El monto debe ser mayor a 0');
        const payment = await this.customerPaymentRepo.manager.transaction(async (manager) => {
            const customer = await manager.findOne(customer_entity_1.Customer, {
                where: { id, tenant_id: tenantId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!customer)
                throw new common_1.NotFoundException('Cliente no encontrado');
            if (amount > Number(customer.current_debt) + 0.0001) {
                throw new common_1.BadRequestException('El abono no puede superar la deuda actual del cliente');
            }
            const savedPayment = await manager.save(manager.create(customer_account_payment_entity_1.CustomerAccountPayment, {
                tenant_id: tenantId,
                customer_id: id,
                amount,
                payment_method: dto.payment_method || customer_account_payment_entity_1.CustomerPaymentMethod.CASH,
                notes: dto.notes || null,
            }));
            await manager.update(customer_entity_1.Customer, { id, tenant_id: tenantId }, {
                current_debt: Number(customer.current_debt) - amount,
            });
            return savedPayment;
        });
        this.eventEmitter.emit('customer.payment.created', new customer_payment_created_event_1.CustomerPaymentCreatedEvent(tenantId, payment.id, id, amount, payment.payment_method));
        return this.findOneCustomer(id, tenantId);
    }
    async getCustomerAccount(id, tenantId) {
        const customer = await this.findOneCustomer(id, tenantId);
        const [sales, payments, returns] = await Promise.all([
            this.saleRepo.find({
                where: { customer_id: id, tenant_id: tenantId, payment_method: sale_entity_1.PaymentMethod.CREDIT_CLIENT },
                order: { created_at: 'ASC' },
            }),
            this.customerPaymentRepo.find({ where: { customer_id: id, tenant_id: tenantId }, order: { created_at: 'ASC' } }),
            this.saleReturnRepo.createQueryBuilder('saleReturn')
                .innerJoin('saleReturn.sale', 'sale')
                .where('saleReturn.tenant_id = :tenantId', { tenantId })
                .andWhere('sale.customer_id = :customerId', { customerId: id })
                .andWhere('sale.payment_method = :paymentMethod', { paymentMethod: sale_entity_1.PaymentMethod.CREDIT_CLIENT })
                .orderBy('saleReturn.created_at', 'ASC')
                .getMany(),
        ]);
        const entries = [
            ...sales.map((sale) => ({
                id: sale.id,
                date: sale.created_at,
                type: 'sale',
                description: `Venta fiada #${sale.id.slice(0, 8).toUpperCase()}`,
                amount: Number(sale.total),
                balance_effect: 'increase',
                payment_method: sale.payment_method,
            })),
            ...payments.map((payment) => ({
                id: payment.id,
                date: payment.created_at,
                type: 'payment',
                description: payment.notes || 'Abono de cuenta corriente',
                amount: Number(payment.amount),
                balance_effect: 'decrease',
                payment_method: payment.payment_method,
            })),
            ...returns.map((returned) => ({
                id: returned.id,
                date: returned.created_at,
                type: 'return',
                description: `Devolución de venta: ${returned.reason}`,
                amount: Number(returned.total),
                balance_effect: 'decrease',
                payment_method: null,
            })),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return {
            account_type: 'customer',
            account: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                credit_limit: Number(customer.credit_limit),
                balance: Number(customer.current_debt),
                account_type: 'customer',
            },
            balance: Number(customer.current_debt),
            entries,
        };
    }
    async findAllPaymentAccounts(tenantId) {
        return this.paymentAccountRepo.find({
            where: { tenant_id: tenantId },
            order: { name: 'ASC' },
        });
    }
    async findOnePaymentAccount(id, tenantId) {
        const account = await this.paymentAccountRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!account)
            throw new common_1.NotFoundException('Cuenta de pago no encontrada');
        return account;
    }
    async createPaymentAccount(dto, tenantId) {
        const account = this.paymentAccountRepo.create({ ...dto, tenant_id: tenantId });
        return this.paymentAccountRepo.save(account);
    }
    async updatePaymentAccount(id, dto, tenantId) {
        const account = await this.findOnePaymentAccount(id, tenantId);
        Object.assign(account, dto);
        return this.paymentAccountRepo.save(account);
    }
    async deletePaymentAccount(id, tenantId) {
        const account = await this.findOnePaymentAccount(id, tenantId);
        await this.paymentAccountRepo.remove(account);
        return { message: 'Cuenta eliminada correctamente' };
    }
    async assertBranchExists(branchId, tenantId) {
        const branch = await this.branchRepo.findOne({ where: { id: branchId, tenant_id: tenantId } });
        if (!branch) {
            throw new common_1.BadRequestException('La sucursal seleccionada no existe o no pertenece a tu negocio');
        }
        return branch;
    }
    shouldAutoVerify(paymentMethod) {
        const autoVerifyMethods = [
            sale_entity_1.PaymentMethod.CASH,
            sale_entity_1.PaymentMethod.CREDIT_CLIENT,
            sale_entity_1.PaymentMethod.DEBIT_CARD,
            sale_entity_1.PaymentMethod.CREDIT_CARD,
        ];
        return autoVerifyMethods.includes(paymentMethod);
    }
    resolvePaymentStatus(paymentMethod, explicitStatus, mpStatus) {
        if (explicitStatus)
            return explicitStatus;
        if (mpStatus) {
            const normalized = mpStatus.toLowerCase();
            if (normalized === 'approved')
                return sale_entity_1.PaymentStatus.CONFIRMED;
            if (normalized === 'rejected' || normalized === 'cancelled')
                return sale_entity_1.PaymentStatus.FAILED;
            return sale_entity_1.PaymentStatus.PENDING;
        }
        return this.shouldAutoVerify(paymentMethod) ? sale_entity_1.PaymentStatus.CONFIRMED : sale_entity_1.PaymentStatus.PENDING;
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(sale_item_entity_1.SaleItem)),
    __param(2, (0, typeorm_1.InjectRepository)(cash_register_entity_1.CashRegister)),
    __param(3, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(4, (0, typeorm_1.InjectRepository)(customer_account_payment_entity_1.CustomerAccountPayment)),
    __param(5, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __param(6, (0, typeorm_1.InjectRepository)(payment_account_entity_1.PaymentAccount)),
    __param(7, (0, typeorm_1.InjectRepository)(sale_return_entity_1.SaleReturn)),
    __param(8, (0, typeorm_1.InjectRepository)(sale_return_item_entity_1.SaleReturnItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inventory_service_1.InventoryService,
        electronic_invoicing_service_1.ElectronicInvoicingService,
        event_emitter_1.EventEmitter2])
], SalesService);
//# sourceMappingURL=sales.service.js.map