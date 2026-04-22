import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import expensesApi, { type CreateExpensePayload, type CreateCategoryPayload } from '@api/expenses.api'
import toast from 'react-hot-toast'

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: expensesApi.getCategories,
  })
}

export function useExpenses(params?: { start_date?: string; end_date?: string; category_id?: string }) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expensesApi.getExpenses(params),
  })
}

export function useExpenseSummary(params?: { start_date?: string; end_date?: string }) {
  return useQuery({
    queryKey: ['expenses-summary', params],
    queryFn: () => expensesApi.getSummary(params),
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpensePayload) => expensesApi.createExpense(data),
    onSuccess: () => {
      toast.success('Gasto registrado')
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expenses-summary'] })
    },
    onError: () => toast.error('Error al registrar el gasto'),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExpensePayload> }) =>
      expensesApi.updateExpense(id, data),
    onSuccess: () => {
      toast.success('Gasto actualizado')
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expenses-summary'] })
    },
    onError: () => toast.error('Error al actualizar el gasto'),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteExpense(id),
    onSuccess: () => {
      toast.success('Gasto eliminado')
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expenses-summary'] })
    },
    onError: () => toast.error('Error al eliminar el gasto'),
  })
}

export function useCreateExpenseCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCategoryPayload) => expensesApi.createCategory(data),
    onSuccess: () => {
      toast.success('Categoría creada')
      qc.invalidateQueries({ queryKey: ['expense-categories'] })
    },
    onError: () => toast.error('Error al crear la categoría'),
  })
}

export function useUpdateExpenseCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryPayload> }) =>
      expensesApi.updateCategory(id, data),
    onSuccess: () => {
      toast.success('Categoría actualizada')
      qc.invalidateQueries({ queryKey: ['expense-categories'] })
    },
    onError: () => toast.error('Error al actualizar'),
  })
}

export function useDeleteExpenseCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteCategory(id),
    onSuccess: () => {
      toast.success('Categoría eliminada')
      qc.invalidateQueries({ queryKey: ['expense-categories'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al eliminar'),
  })
}

export function useSeedExpenseCategories() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => expensesApi.seedCategories(),
    onSuccess: () => {
      toast.success('Categorías por defecto creadas')
      qc.invalidateQueries({ queryKey: ['expense-categories'] })
    },
    onError: () => toast.error('Error al crear categorías'),
  })
}
