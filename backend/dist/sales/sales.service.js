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
const cash_register_entity_1 = require("./entities/cash-register.entity");
const customer_entity_1 = require("./entities/customer.entity");
const branch_entity_1 = require("../inventory/entities/branch.entity");
const inventory_service_1 = require("../inventory/inventory.service");
const sale_completed_event_1 = require("./events/sale-completed.event");
let SalesService = class SalesService {
    constructor(saleRepo, saleItemRepo, cashRegisterRepo, customerRepo, branchRepo, inventoryService, eventEmitter) {
        this.saleRepo = saleRepo;
        this.saleItemRepo = saleItemRepo;
        this.cashRegisterRepo = cashRegisterRepo;
        this.customerRepo = customerRepo;
        this.branchRepo = branchRepo;
        this.inventoryService = inventoryService;
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
    async verifySale(saleId, tenantId) {
        const sale = await this.saleRepo.findOne({
            where: { id: saleId, tenant_id: tenantId },
        });
        if (!sale) {
            throw new common_1.NotFoundException('Venta no encontrada');
        }
        if (sale.payment_verified_at) {
            throw new common_1.BadRequestException('Esta venta ya fue verificada');
        }
        sale.payment_status = sale_entity_1.PaymentStatus.CONFIRMED;
        sale.payment_verified_at = new Date();
        sale.status = sale_entity_1.SaleStatus.COMPLETED;
        return this.saleRepo.save(sale);
    }
    async createSale(dto, tenantId, userId) {
        await this.assertBranchExists(dto.branch_id, tenantId);
        const activeRegister = await this.getActiveRegister(tenantId, dto.branch_id, userId);
        if (!activeRegister) {
            throw new common_1.BadRequestException('Debes abrir la caja antes de registrar una venta');
        }
        let customer = null;
        if (dto.payment_method === sale_entity_1.PaymentMethod.CREDIT_CLIENT) {
            if (!dto.customer_id) {
                throw new common_1.BadRequestException('Debes seleccionar un cliente para venderle al fiado');
            }
            customer = await this.findOneCustomer(dto.customer_id, tenantId);
        }
        const total = dto.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);
        const paymentStatus = this.resolvePaymentStatus(dto.payment_method, dto.payment_status, dto.payment_details?.mp_payment_status);
        if (dto.payment_method === sale_entity_1.PaymentMethod.CREDIT_CLIENT && customer) {
            const newDebt = Number(customer.current_debt) + total;
            if (customer.credit_limit > 0 && newDebt > customer.credit_limit) {
                throw new common_1.ForbiddenException(`Límite de crédito excedido. Tope: $${customer.credit_limit}, Deuda acumulada: $${newDebt}`);
            }
            await this.customerRepo.update(customer.id, { current_debt: newDebt });
        }
        if (dto.payment_method === sale_entity_1.PaymentMethod.CASH) {
            await this.cashRegisterRepo.update(activeRegister.id, {
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
        }));
        await this.saleItemRepo.save(saleItems);
        for (const item of saleItems) {
            await this.inventoryService.reduceStock(item.product_id, dto.branch_id, item.quantity, tenantId);
        }
        this.eventEmitter.emit('sale.completed', new sale_completed_event_1.SaleCompletedEvent(tenantId, savedSale.id, total, dto.payment_method, dto.branch_id, userId));
        if (paymentStatus === sale_entity_1.PaymentStatus.CONFIRMED) {
            await this.verifySale(savedSale.id, tenantId);
        }
        return this.saleRepo.findOne({ where: { id: savedSale.id }, relations: ['items', 'customer'] });
    }
    async listSales(tenantId, query) {
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
    async payDebt(id, amount, tenantId) {
        const customer = await this.findOneCustomer(id, tenantId);
        if (amount <= 0)
            throw new common_1.BadRequestException('El monto debe ser mayor a 0');
        let newDebt = Number(customer.current_debt) - amount;
        if (newDebt < 0)
            newDebt = 0;
        await this.customerRepo.update({ id, tenant_id: tenantId }, { current_debt: newDebt });
        return this.findOneCustomer(id, tenantId);
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
    __param(4, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inventory_service_1.InventoryService,
        event_emitter_1.EventEmitter2])
], SalesService);
//# sourceMappingURL=sales.service.js.map