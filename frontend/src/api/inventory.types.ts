// ==========================================
// TIPOS DEL MÓDULO DE INVENTARIO
// ==========================================

export interface Category {
  id: string
  tenant_id: string
  name: string
  color?: string
  icon?: string
  created_at: string
}

export interface Unit {
  id: string
  tenant_id: string
  name: string
  abbreviation?: string
}

export interface PriceList {
  id: string
  tenant_id: string
  name: string
  is_default: boolean
}

export interface ProductPrice {
  id: string
  product_id: string
  price_list_id: string
  price: number
  price_list: PriceList
}

export interface Product {
  id: string
  tenant_id: string
  name: string
  description?: string
  barcode?: string
  internal_code?: string
  cost_price: number
  is_active: boolean
  product_type?: 'standard' | 'raw_material' | 'fractionated' | 'elaborated'
  unit_id?: string
  category_id?: string
  unit?: Unit
  category?: Category
  prices: ProductPrice[]
  min_stock_alert: number
  image_url: string | null
  brand_id?: string
  brand?: Brand
  supplier_id?: string
  inventory?: Inventory // Stock filtrado por sucursal si se solicita
  created_at: string
}

export interface Branch {
  id: string
  tenant_id: string
  name: string
  address?: string
  phone?: string
  is_main_branch: boolean
}

export interface Inventory {
  id: string
  tenant_id: string
  product_id: string
  branch_id: string
  stock_quantity: number
  min_stock_alert: number
  last_restock_date?: string
  product: Product
  branch: Branch
}

export interface ProductQuery {
  search?: string
  category_id?: string
  product_type?: string
  page?: number
  limit?: number
}

export interface PaginatedProducts {
  data: Product[]
  total: number
  page: number
  limit: number
  pages: number
}

export enum PriceAdjustmentType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface BulkUpdatePriceDto {
  category_id?: string
  supplier_id?: string
  brand_id?: string
  adjustment_type: PriceAdjustmentType
  value: number
  price_list_id?: string
}

export interface Brand {
  id: string
  name: string
  tenant_id: string
}

export interface CreateBrandDto {
  name: string
}

export interface TransferStockDto {
  product_id: string
  from_branch_id: string
  to_branch_id: string
  quantity: number
}
