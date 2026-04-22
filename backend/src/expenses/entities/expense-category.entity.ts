import { Entity, Column, OneToMany } from 'typeorm';
import { BaseKioskosEntity } from '../../common/base.entity';
import { Expense } from './expense.entity';

@Entity('expense_categories')
export class ExpenseCategory extends BaseKioskosEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 7, default: '#6366f1' })
  color: string; // Hex color para badge visual

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];
}
