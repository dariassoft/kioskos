import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionApi } from '../api/production.api';
import type { CreateRecipeDto, CreateProductionOrderDto } from '../api/production.types';
import toast from 'react-hot-toast';

export const useRecipes = () => {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: productionApi.getRecipes,
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecipeDto) => productionApi.createRecipe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Receta creada correctamente');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Error al crear la receta'),
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productionApi.deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Receta eliminada');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Error al eliminar la receta'),
  });
};

export const useProductionRequirements = (outputProductId: string, quantity: number, enabled: boolean) => {
  return useQuery({
    queryKey: ['production-requirements', outputProductId, quantity],
    queryFn: () => productionApi.getRequirements(outputProductId, quantity),
    enabled: enabled && !!outputProductId && quantity > 0,
    retry: false,
  });
};

export const useProductionOrders = (branchId?: string) => {
  return useQuery({
    queryKey: ['production-orders', branchId],
    queryFn: () => productionApi.getOrders(branchId),
  });
};

export const useCreateProductionOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductionOrderDto) => productionApi.createOrder(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryByBranch'] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (res.warnings?.length) {
        res.warnings.forEach((w: string) => toast(w, { icon: '⚠️', duration: 5000 }));
      }
      toast.success('Producción registrada. Stock actualizado.', { duration: 4000 });
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Error al registrar la producción'),
  });
};

export const useCancelProductionOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productionApi.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryByBranch'] });
      toast.success('Producción cancelada y stock revertido');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Error al cancelar la producción'),
  });
};
