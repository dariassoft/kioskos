import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@api/sales.api'
import type { Customer, CreateSaleDto } from '@api/sales.types'
import toast from 'react-hot-toast'

// ==========================================
// CAJA REGISTRADORA
// ==========================================

export const useActiveRegister = (branchId: string) =>
  useQuery({
    queryKey: ['cash-register', 'active', branchId],
    queryFn: () => salesApi.getActiveRegister(branchId),
    enabled: !!branchId,
  })

export const useOpenRegister = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ branchId, balance }: { branchId: string; balance: number }) =>
      salesApi.openRegister(branchId, balance),
    onSuccess: (_, { branchId }) => {
      qc.invalidateQueries({ queryKey: ['cash-register', 'active', branchId] })
      toast.success('Caja abierta correctamente')
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Error al abrir caja'),
  })
}

export const useCloseRegister = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ branchId, balance }: { branchId: string; balance: number }) =>
      salesApi.closeRegister(branchId, balance),
    onSuccess: (_, { branchId }) => {
      qc.invalidateQueries({ queryKey: ['cash-register', 'active', branchId] })
      toast.success('Caja cerrada correctamente')
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Error al cerrar caja'),
  })
}

// ==========================================
// VENTAS (POS)
// ==========================================

export const useCreateSale = () => {
  // Aquí no invalidamos queries automáticamente porque el POS es crítico en rendimiento.
  // Solo se envía el toast. La reducción de stock sucede en backend.
  return useMutation({
    mutationFn: (data: CreateSaleDto) => salesApi.createSale(data),
    onSuccess: () => {
      toast.success('Venta registrada con éxito')
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Error al procesar la venta'),
  })
}

// ==========================================
// CLIENTES (Customers / Fiados)
// ==========================================

export const useCustomers = () =>
  useQuery({
    queryKey: ['customers'],
    queryFn: salesApi.getCustomers,
  })

export const useCreateCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: salesApi.createCustomer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Cliente creado')
    },
  })
}

export const useUpdateCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      salesApi.updateCustomer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Cliente actualizado')
    },
  })
}

export const usePayDebt = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      salesApi.payDebt(id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Pago registrado')
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Error al registrar el pago'),
  })
}
