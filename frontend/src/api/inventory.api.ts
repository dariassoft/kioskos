import apiClient from '@api/client'
import type {
  Product, Branch, Category, Unit, PriceList,
  Inventory, ProductQuery, PaginatedProducts,
} from './inventory.types'

// ==========================================
// PRODUCTOS
// ==========================================
export const inventoryApi = {
  // Productos
  getProducts: async (params?: ProductQuery): Promise<PaginatedProducts> => {
    const res = await apiClient.get('/inventory/products', { params })
    return res.data
  },

  getProduct: async (id: string): Promise<Product> => {
    const res = await apiClient.get(`/inventory/products/${id}`)
    return res.data
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const res = await apiClient.post('/inventory/products', data)
    return res.data
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    const res = await apiClient.patch(`/inventory/products/${id}`, data)
    return res.data
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/products/${id}`)
  },

  setPrice: async (productId: string, data: { price_list_id: string; price: number }) => {
    const res = await apiClient.post(`/inventory/products/${productId}/prices`, data)
    return res.data
  },

  addStock: async (productId: string, data: { branch_id: string; quantity: number; min_stock_alert?: number }) => {
    const res = await apiClient.post(`/inventory/products/${productId}/stock`, data)
    return res.data
  },

  quickSearch: async (q: string): Promise<Product[]> => {
    const res = await apiClient.get('/inventory/products/search', { params: { q } })
    return res.data
  },

  // Stock
  getStockByBranch: async (branchId: string): Promise<Inventory[]> => {
    const res = await apiClient.get('/inventory/stock', { params: { branch_id: branchId } })
    return res.data
  },

  getLowStock: async (): Promise<Inventory[]> => {
    const res = await apiClient.get('/inventory/stock/low')
    return res.data
  },

  // Sucursales
  getBranches: async (): Promise<Branch[]> => {
    const res = await apiClient.get('/inventory/branches')
    return res.data
  },

  createBranch: async (data: Partial<Branch>): Promise<Branch> => {
    const res = await apiClient.post('/inventory/branches', data)
    return res.data
  },

  // Categorías
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get('/inventory/categories')
    return res.data
  },

  createCategory: async (data: { name: string; color?: string; icon?: string }): Promise<Category> => {
    const res = await apiClient.post('/inventory/categories', data)
    return res.data
  },

  // Unidades
  getUnits: async (): Promise<Unit[]> => {
    const res = await apiClient.get('/inventory/units')
    return res.data
  },

  // Listas de precios
  getPriceLists: async (): Promise<PriceList[]> => {
    const res = await apiClient.get('/inventory/price-lists')
    return res.data
  },
}
