import apiClient from './client'

export interface ExpenseCategory {
  id: string
  tenant_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export type ExpensePaymentMethod = 'cash' | 'card' | 'transfer'

export const PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

export interface Expense {
  id: string
  tenant_id: string
  description: string
  amount: number
  date: string
  category_id: string
  category?: ExpenseCategory
  branch_id: string | null
  payment_method: ExpensePaymentMethod
  receipt_number: string | null
  notes: string | null
  receipt_image: string | null
  created_at: string
  updated_at: string
  status: 'active' | 'voided'
  void_reason?: string | null
  voided_at?: string | null
}

export interface ExpenseSummary {
  total: number
  count: number
  by_category: Array<{
    category_name: string
    category_color: string
    total: number
    count: number
  }>
}

export interface CreateExpensePayload {
  description: string
  amount: number
  date: string
  category_id: string
  branch_id?: string
  payment_method: ExpensePaymentMethod
  receipt_number?: string
  notes?: string
  receipt_image?: string
}

export interface CreateCategoryPayload {
  name: string
  color?: string
}

export interface VoidExpensePayload { reason: string }

const expensesApi = {
  // Categorías
  getCategories: (): Promise<ExpenseCategory[]> =>
    apiClient.get('/expenses/categories').then((r) => r.data),

  createCategory: (data: CreateCategoryPayload): Promise<ExpenseCategory> =>
    apiClient.post('/expenses/categories', data).then((r) => r.data),

  updateCategory: (id: string, data: Partial<CreateCategoryPayload>): Promise<ExpenseCategory> =>
    apiClient.patch(`/expenses/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: string): Promise<void> =>
    apiClient.delete(`/expenses/categories/${id}`).then(() => undefined),

  seedCategories: (): Promise<void> =>
    apiClient.post('/expenses/categories/seed').then(() => undefined),

  // Gastos
  getExpenses: (params?: { start_date?: string; end_date?: string; category_id?: string }): Promise<Expense[]> =>
    apiClient.get('/expenses', { params }).then((r) => r.data),

  getExpense: (id: string): Promise<Expense> =>
    apiClient.get(`/expenses/${id}`).then((r) => r.data),

  createExpense: (data: CreateExpensePayload): Promise<Expense> =>
    apiClient.post('/expenses', data).then((r) => r.data),

  updateExpense: (id: string, data: Partial<CreateExpensePayload>): Promise<Expense> =>
    apiClient.patch(`/expenses/${id}`, data).then((r) => r.data),

  deleteExpense: (id: string): Promise<void> =>
    apiClient.delete(`/expenses/${id}`).then(() => undefined),

  voidExpense: (id: string, data: VoidExpensePayload): Promise<Expense> =>
    apiClient.post(`/expenses/${id}/void`, data).then((r) => r.data),

  getSummary: (params?: { start_date?: string; end_date?: string }): Promise<ExpenseSummary> =>
    apiClient.get('/expenses/summary', { params }).then((r) => r.data),
}

export default expensesApi
