import apiClient from '@api/client'
import type {
  Product, Branch, Category, Unit, PriceList,
  Inventory, ProductQuery, PaginatedProducts,
  BulkUpdatePriceDto, Brand, CreateBrandDto,
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

  uploadProductImage: async (productId: string, file: File): Promise<Product> => {
    const formData = new FormData()
    formData.append('image', file)
    const res = await apiClient.post(`/inventory/products/${productId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  setPrice: async (productId: string, data: { price_list_id: string; price: number }) => {
    const res = await apiClient.post(`/inventory/products/${productId}/prices`, data)
    return res.data
  },

  addStock: async (productId: string, data: { branch_id: string; quantity: number; min_stock_alert?: number }) => {
    const res = await apiClient.post(`/inventory/products/${productId}/stock`, data)
    return res.data
  },

  quickSearch: async (q: string, branch_id?: string): Promise<Product[]> => {
    const res = await apiClient.get('/inventory/products/search', { params: { q, branch_id } })
    return Array.isArray(res.data) ? res.data : []
  },

  // Stock
  getStockByBranch: async (branchId: string): Promise<Inventory[]> => {
    const res = await apiClient.get('/inventory/stock', { params: { branch_id: branchId } })
    return Array.isArray(res.data) ? res.data : []
  },

  getLowStock: async (): Promise<Inventory[]> => {
    const res = await apiClient.get('/inventory/stock/low')
    return Array.isArray(res.data) ? res.data : []
  },

  // Sucursales
  getBranches: async (): Promise<Branch[]> => {
    const res = await apiClient.get('/inventory/branches')
    return Array.isArray(res.data) ? res.data : []
  },

  createBranch: async (data: Partial<Branch>): Promise<Branch> => {
    const res = await apiClient.post('/inventory/branches', data)
    return res.data
  },

  // Categorías
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get('/inventory/categories')
    return Array.isArray(res.data) ? res.data : []
  },

  createCategory: async (data: { name: string; color?: string; icon?: string }): Promise<Category> => {
    const res = await apiClient.post('/inventory/categories', data)
    return res.data
  },

  // Unidades
  getUnits: async (): Promise<Unit[]> => {
    const res = await apiClient.get('/inventory/units')
    return Array.isArray(res.data) ? res.data : []
  },

  // Listas de precios
  getPriceLists: async (): Promise<PriceList[]> => {
    const res = await apiClient.get('/inventory/price-lists')
    return Array.isArray(res.data) ? res.data : []
  },
  
  async bulkUpdatePrices(data: BulkUpdatePriceDto): Promise<{ updated: number }> {
    const res = await apiClient.post('/inventory/prices/bulk-update', data)
    return res.data
  },

  // MARCAS
  async getBrands(): Promise<Brand[]> {
    const res = await apiClient.get('/inventory/brands')
    return res.data
  },

  async createBrand(data: CreateBrandDto): Promise<Brand> {
    const res = await apiClient.post('/inventory/brands', data)
    return res.data
  },
}
