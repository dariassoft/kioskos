import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import {
  CreateExpenseCategoryDto, UpdateExpenseCategoryDto,
  CreateExpenseDto, UpdateExpenseDto,
} from './dto/expenses.dto';
import { ExpenseCreatedEvent } from './events/expense-created.event';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepo: Repository<ExpenseCategory>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================
  // CATEGORÍAS DE GASTOS
  // ==========================================

  async findAllCategories(tenantId: string): Promise<ExpenseCategory[]> {
    return this.categoryRepo.find({
      where: { tenant_id: tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOneCategory(id: string, tenantId: string): Promise<ExpenseCategory> {
    const category = await this.categoryRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!category) throw new NotFoundException('Categoría de gasto no encontrada');
    return category;
  }

  async createCategory(dto: CreateExpenseCategoryDto, tenantId: string): Promise<ExpenseCategory> {
    const category = this.categoryRepo.create({ ...dto, tenant_id: tenantId });
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, dto: UpdateExpenseCategoryDto, tenantId: string): Promise<ExpenseCategory> {
    await this.findOneCategory(id, tenantId);
    await this.categoryRepo.update({ id, tenant_id: tenantId }, dto as any);
    return this.findOneCategory(id, tenantId);
  }

  async removeCategory(id: string, tenantId: string): Promise<void> {
    const category = await this.findOneCategory(id, tenantId);
    // Verificar que no tenga gastos asociados
    const count = await this.expenseRepo.count({ where: { category_id: id, tenant_id: tenantId } });
    if (count > 0) {
      throw new BadRequestException(`No se puede eliminar: hay ${count} gasto(s) asociado(s) a esta categoría.`);
    }
    await this.categoryRepo.remove(category);
  }

  /**
   * Crea las categorías por defecto para un tenant nuevo
   */
  async seedDefaultCategories(tenantId: string): Promise<void> {
    const existing = await this.categoryRepo.count({ where: { tenant_id: tenantId } });
    if (existing > 0) return; // Ya tiene categorías

    const defaults = [
      { name: 'Alquiler', color: '#ef4444' },
      { name: 'Servicios (Luz/Gas/Agua)', color: '#f59e0b' },
      { name: 'Sueldos', color: '#3b82f6' },
      { name: 'Impuestos', color: '#8b5cf6' },
      { name: 'Transporte', color: '#06b6d4' },
      { name: 'Limpieza', color: '#10b981' },
      { name: 'Mantenimiento', color: '#f97316' },
      { name: 'Varios', color: '#6b7280' },
    ];

    const entities = defaults.map((d) =>
      this.categoryRepo.create({ ...d, tenant_id: tenantId }),
    );
    await this.categoryRepo.save(entities);
  }

  // ==========================================
  // GASTOS
  // ==========================================

  async findAll(tenantId: string, startDate?: string, endDate?: string, categoryId?: string): Promise<Expense[]> {
    const qb = this.expenseRepo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .where('expense.tenant_id = :tenantId', { tenantId });

    if (startDate && endDate) {
      qb.andWhere('expense.date >= :startDate AND expense.date <= :endDate', { startDate, endDate });
    }

    if (categoryId) {
      qb.andWhere('expense.category_id = :categoryId', { categoryId });
    }

    return qb.orderBy('expense.date', 'DESC').addOrderBy('expense.created_at', 'DESC').getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Expense> {
    const expense = await this.expenseRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['category'],
    });
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    return expense;
  }

  async create(dto: CreateExpenseDto, tenantId: string): Promise<Expense> {
    // Validar que la categoría pertenece al tenant
    const category = await this.findOneCategory(dto.category_id, tenantId);

    const expense = this.expenseRepo.create({
      ...dto,
      tenant_id: tenantId,
    });

    const saved = await this.expenseRepo.save(expense);

    // Emitir evento para contabilidad
    this.eventEmitter.emit(
      'expense.created',
      new ExpenseCreatedEvent(
        tenantId,
        saved.id,
        Number(saved.amount),
        category.name,
        saved.payment_method,
        saved.branch_id,
      ),
    );

    return this.findOne(saved.id, tenantId);
  }

  async update(id: string, dto: UpdateExpenseDto, tenantId: string): Promise<Expense> {
    await this.findOne(id, tenantId);
    if (dto.category_id) {
      await this.findOneCategory(dto.category_id, tenantId);
    }
    await this.expenseRepo.update({ id, tenant_id: tenantId }, dto as any);
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const expense = await this.findOne(id, tenantId);
    await this.expenseRepo.remove(expense);
  }

  async getSummary(tenantId: string, startDate?: string, endDate?: string) {
    const qb = this.expenseRepo
      .createQueryBuilder('expense')
      .leftJoin('expense.category', 'category')
      .select('category.name', 'category_name')
      .addSelect('category.color', 'category_color')
      .addSelect('SUM(expense.amount)', 'total')
      .addSelect('COUNT(expense.id)', 'count')
      .where('expense.tenant_id = :tenantId', { tenantId })
      .groupBy('expense.category_id')
      .addGroupBy('category.name')
      .addGroupBy('category.color');

    if (startDate && endDate) {
      qb.andWhere('expense.date >= :startDate AND expense.date <= :endDate', { startDate, endDate });
    }

    const byCategory = await qb.getRawMany();

    // Total general
    const totalQb = this.expenseRepo
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total')
      .addSelect('COUNT(expense.id)', 'count')
      .where('expense.tenant_id = :tenantId', { tenantId });

    if (startDate && endDate) {
      totalQb.andWhere('expense.date >= :startDate AND expense.date <= :endDate', { startDate, endDate });
    }

    const totalResult = await totalQb.getRawOne();

    return {
      total: Number(totalResult?.total || 0),
      count: Number(totalResult?.count || 0),
      by_category: byCategory.map((r) => ({
        category_name: r.category_name,
        category_color: r.category_color,
        total: Number(r.total),
        count: Number(r.count),
      })),
    };
  }
}
