export interface Branch {
  id: string
  tenant_id: string
  name: string
  address: string | null
  phone: string | null
  is_main_branch: boolean
  created_at: string
  updated_at: string
}
export interface UserItem {
  id: string
  tenant_id: string
  branch_id: string | null
  branch_name: string | null
  name: string
  email: string
  role: 'admin' | 'manager' | 'cashier'
  is_active: boolean
  created_at: string
  updated_at: string
}
export interface Plan {
  id: string
  name: string
  description: string
  price_monthly: number
  max_branches: number
  max_users: number
  features: Record<string, boolean>
  is_active: boolean
}
export interface BusinessProfile {
  id: string
  business_name: string
  tax_id: string | null
  owner_email: string
  logo_url: string | null
  phone: string | null
  address: string | null
  status: 'active' | 'suspended' | 'trial' | 'past_due'
  current_plan: Plan | null
  branch_count: number
  user_count: number
  created_at: string
}

export interface MercadopagoCredentials {
  id: string
  tenant_id: string
  public_key: string | null
  access_token: string | null
  store_id: string | null
  pos_id: string | null
  is_sandbox: boolean
  is_configured: boolean
  last_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface SaveMercadopagoCredentialsDto {
  public_key: string
  access_token: string
  store_id?: string
  pos_id?: string
  is_sandbox?: boolean
}
// DTOs de formulario
export interface CreateBranchDto {
  name: string
  address?: string
  phone?: string
  is_main_branch?: boolean
}
export interface UpdateBranchDto {
  name?: string
  address?: string
  phone?: string
}
export type UserRole = 'admin' | 'manager' | 'cashier'
export interface CreateUserDto {
  name: string
  email: string
  password: string
  role: UserRole
  branch_id?: string
}
export interface UpdateUserDto {
  name?: string
  role?: UserRole
  branch_id?: string | null
  is_active?: boolean
  password?: string
}
export interface UpdateBusinessProfileDto {
  business_name?: string
  tax_id?: string
  phone?: string
  address?: string
}
