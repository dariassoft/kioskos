import apiClient from './client';
import type {
  Recipe,
  CreateRecipeDto,
  ProductionOrder,
  CreateProductionOrderDto,
  CreateProductionResponse,
  ProductionRequirements,
} from './production.types';

export const productionApi = {
  // Recetas
  getRecipes: () =>
    apiClient.get<Recipe[]>('/production/recipes').then((res: any) => Array.isArray(res.data) ? res.data : []),
  createRecipe: (data: CreateRecipeDto) =>
    apiClient.post<Recipe>('/production/recipes', data).then((res: any) => res.data),
  updateRecipe: (id: string, data: Partial<CreateRecipeDto>) =>
    apiClient.patch<Recipe>(`/production/recipes/${id}`, data).then((res: any) => res.data),
  deleteRecipe: (id: string) =>
    apiClient.delete(`/production/recipes/${id}`).then((res: any) => res.data),

  // Cálculo estimado de insumos (seguimiento calculado)
  getRequirements: (outputProductId: string, quantity: number) =>
    apiClient.get<ProductionRequirements>('/production/requirements', {
      params: { output_product_id: outputProductId, quantity },
    }).then((res: any) => res.data),

  // Órdenes de producción
  getOrders: (branchId?: string) =>
    apiClient.get<ProductionOrder[]>('/production/orders', {
      params: branchId ? { branch_id: branchId } : {},
    }).then((res: any) => Array.isArray(res.data) ? res.data : []),
  createOrder: (data: CreateProductionOrderDto) =>
    apiClient.post<CreateProductionResponse>('/production/orders', data).then((res: any) => res.data),
  cancelOrder: (id: string) =>
    apiClient.post<ProductionOrder>(`/production/orders/${id}/cancel`).then((res: any) => res.data),
};
