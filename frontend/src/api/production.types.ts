// ==========================================
// TIPOS DEL MÓDULO DE PRODUCCIÓN (Fase 14)
// ==========================================

export type ProductType = 'standard' | 'raw_material' | 'fractionated' | 'elaborated'
export type RecipeType = 'fractioning' | 'elaboration'
export type ProductionStatus = 'completed' | 'cancelled'

export interface RecipeItem {
  id: string
  recipe_id: string
  product_id: string
  quantity: number
  product?: { id: string; name: string; product_type?: ProductType }
}

export interface Recipe {
  id: string
  tenant_id: string
  name: string
  type: RecipeType
  output_product_id: string
  output_quantity: number
  notes?: string
  is_active: boolean
  output_product?: { id: string; name: string; product_type?: ProductType }
  items: RecipeItem[]
  created_at: string
}

export interface CreateRecipeDto {
  name: string
  type: RecipeType
  output_product_id: string
  output_quantity: number
  notes?: string
  items: { product_id: string; quantity: number }[]
}

export interface ProductionLine {
  id: string
  product_id: string
  quantity: number
  unit_cost: number
  subtotal: number
  product?: { id: string; name: string; product_type?: ProductType }
}

export interface ProductionOrder {
  id: string
  tenant_id: string
  branch_id: string
  recipe_id?: string | null
  user_id?: string | null
  status: ProductionStatus
  total_input_cost: number
  notes?: string
  cancelled_at?: string | null
  recipe?: Recipe | null
  inputs: ProductionLine[]
  outputs: ProductionLine[]
  created_at: string
}

export interface CreateProductionOrderDto {
  branch_id: string
  recipe_id?: string
  notes?: string
  inputs: { product_id: string; quantity: number }[]
  outputs: { product_id: string; quantity: number; unit_cost?: number }[]
}

export interface ProductionRequirements {
  recipe_id: string
  recipe_name: string
  output_product_id: string
  desired_quantity: number
  batches: number
  estimated_inputs: {
    product_id: string
    product_name: string
    estimated_quantity: number
  }[]
}

export interface CreateProductionResponse {
  order: ProductionOrder
  warnings: string[]
}
