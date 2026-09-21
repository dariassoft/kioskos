import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesApi } from '../api/purchases.api';
import type { CreateSupplierDto, CreatePurchaseOrderDto, PurchaseReturnDto } from '../api/purchases.types';
import toast from 'react-hot-toast';

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: purchasesApi.getSuppliers,
  });
};

export const useSupplierAccount = (supplierId?: string) => useQuery({
  queryKey: ['supplier-account', supplierId],
  queryFn: () => purchasesApi.getSupplierAccount(supplierId as string),
  enabled: Boolean(supplierId),
});

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupplierDto) => purchasesApi.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Proveedor creado correctamente');
    },
    onError: () => toast.error('Error al crear el proveedor'),
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSupplierDto> }) => 
      purchasesApi.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Proveedor actualizado');
    },
    onError: () => toast.error('Error al actualizar el proveedor'),
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchasesApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Proveedor eliminado');
    },
    onError: (error: any) => 
      toast.error(error?.response?.data?.message || 'Error al eliminar el proveedor'),
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: purchasesApi.getOrders,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseOrderDto) => purchasesApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Orden de compra creada exitosamente');
    },
    onError: () => toast.error('Error al crear la orden de compra'),
  });
};

export const useReceiveOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: CreatePurchaseOrderDto }) => purchasesApi.receiveOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      // Invalidate inventory because stock increased
      queryClient.invalidateQueries({ queryKey: ['inventoryByBranch'] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
      toast.success('Orden recibida. Stock y Contabilidad actualizados.', { duration: 4000 });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Error al recibir la orden'),
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePurchaseOrderDto }) => purchasesApi.updateOrder(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); toast.success('Orden de compra actualizada'); },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Error al actualizar la orden'),
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchasesApi.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Orden de compra cancelada');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Error al cancelar la orden'),
  });
};

export const useCreatePurchasePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, payment_method, notes }: { id: string; amount: number; payment_method: 'cash' | 'transfer' | 'bank'; notes?: string }) => purchasesApi.createPayment(id, { amount, payment_method, notes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); toast.success('Pago a proveedor registrado'); },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Error al registrar el pago'),
  });
};

export const useCreatePurchaseReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PurchaseReturnDto }) => purchasesApi.createReturn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryByBranch'] });
      toast.success('Devolución registrada y stock actualizado');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Error al registrar la devolución'),
  });
};
