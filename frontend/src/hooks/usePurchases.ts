import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesApi } from '../api/purchases.api';
import type { CreateSupplierDto, CreatePurchaseOrderDto } from '../api/purchases.types';
import toast from 'react-hot-toast';

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: purchasesApi.getSuppliers,
  });
};

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
    mutationFn: (id: string) => purchasesApi.receiveOrder(id),
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
