import apiClient from './client';
import type { Supplier, CreateSupplierDto, PurchaseOrder, CreatePurchaseOrderDto, PurchasePayment } from './purchases.types';

export const purchasesApi = {
  // Proveedores
  getSuppliers: () => apiClient.get<Supplier[]>('/purchases/suppliers').then((res: any) => Array.isArray(res.data) ? res.data : []),
  createSupplier: (data: CreateSupplierDto) => apiClient.post<Supplier>('/purchases/suppliers', data).then((res: any) => res.data),
  updateSupplier: (id: string, data: Partial<CreateSupplierDto>) => apiClient.patch<Supplier>(`/purchases/suppliers/${id}`, data).then((res: any) => res.data),

  // Órdenes
  getOrders: () => apiClient.get<PurchaseOrder[]>('/purchases/orders').then((res: any) => Array.isArray(res.data) ? res.data : []),
  createOrder: (data: CreatePurchaseOrderDto) => apiClient.post<PurchaseOrder>('/purchases/orders', data).then((res: any) => res.data),
  receiveOrder: (id: string) => apiClient.post<PurchaseOrder>(`/purchases/orders/${id}/receive`).then((res: any) => res.data),
  cancelOrder: (id: string) => apiClient.post<PurchaseOrder>(`/purchases/orders/${id}/cancel`).then((res: any) => res.data),
  createPayment: (id: string, data: Omit<PurchasePayment, 'id' | 'created_at'>) => apiClient.post<PurchasePayment>(`/purchases/orders/${id}/payments`, data).then((res: any) => res.data),
  deleteSupplier: (id: string) => apiClient.delete(`/purchases/suppliers/${id}`).then((res: any) => res.data),
};
