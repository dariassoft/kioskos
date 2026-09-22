import apiClient from './client'

export interface PublicPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  max_branches: number
  max_users: number
  features: Record<string, boolean>
}

export const FEATURE_LABELS: Record<string, string> = {
  // Claves base y variantes
  pos_terminal: 'Terminal POS (Punto de Venta)',
  inventory: 'Control de Inventario y Stock',
  barcode_scanner: 'Soporte para Código de Barras',
  categories_brands: 'Categorías y Marcas',
  customers_credit: 'Clientes y Cuentas Corrientes',
  purchases_suppliers: 'Compras y Proveedores',
  automated_accounting: 'Contabilidad',
  accounting: 'Contabilidad',
  reports_bi: 'Historial de Reportes',
  reports_history: 'Historial de Reportes',
  export_pdf_excel: 'Exportación PDF/Excel',
  pdf_export: 'Exportación PDF/Excel',
  multi_branch: 'Multisucursal',
  multisite: 'Multisucursal',
  electronic_invoicing: 'Facturación Electrónica AFIP',
  feature_afip: 'Facturación Electrónica AFIP',
  email_notifications: 'Alertas por Email',
  email_alerts: 'Alertas por Email',
  feature_email_alerts: 'Alertas por Email',
  priority_support: 'Soporte Prioritario',
  daily_backups: 'Backups Diarios en la Nube',
  ai_assistant: 'Asistente de Compras con IA',
  feature_export: 'Exportación PDF/Excel',
  feature_reports_history: 'Historial de Reportes',
  feature_multi_branch: 'Multisucursal',
  feature_accounting: 'Contabilidad',
  expenses_management: 'Gestión de Gastos',
  feature_expenses: 'Gestión de Gastos',
  production: 'Producción y Fraccionamiento',
  returns_and_vat: 'Devoluciones e IVA',
  current_accounts: 'Cuentas Corrientes de Clientes',
  supplier_current_accounts: 'Cuentas Corrientes de Proveedores',
  payment_integrations: 'Pagos electrónicos y transferencias',
  // Alias literales (para casos de replace o keys en ingles puro con espacios)
  'pdf export': 'Exportación PDF/Excel',
  'email alerts': 'Alertas por Email',
  'reports history': 'Historial de Reportes',
}

export const PLAN_FEATURES = [
  'pos_terminal',
  'inventory',
  'barcode_scanner',
  'categories_brands',
  'customers_credit',
  'purchases_suppliers',
  'current_accounts',
  'payment_integrations',
  'automated_accounting',
  'reports_bi',
  'export_pdf_excel',
  'email_notifications',
  'electronic_invoicing',
  'expenses_management',
  'supplier_current_accounts',
  'returns_and_vat',
  'production',
  'multi_branch',
] as const

export interface StartCheckoutPayload {
  plan_id: string
  business_name: string
  owner_name: string
  owner_email: string
  owner_phone?: string
  tax_id?: string
  password: string
  payment_method: 'mercadopago' | 'transfer' | 'trial'
  referred_by_code?: string
}

export interface CheckoutResult {
  pending_id: string
  payment_method: string
  is_free?: boolean
  sandbox?: boolean
  mp_init_point?: string
  transfer_data?: {
    alias: string
    cbu: string
    amount: number
    reference: string
  }
}

export type PendingSubscriptionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'manual_pending'
  | 'manual_approved'

export interface PendingSubscriptionItem {
  id: string
  plan_id: string
  amount: number
  business_name: string
  owner_email: string
  owner_name: string
  owner_phone: string | null
  tax_id: string | null
  status: PendingSubscriptionStatus
  payment_method: 'mercadopago' | 'transfer' | string
  mp_preference_id: string | null
  mp_payment_id: string | null
  mp_init_point: string | null
  transfer_alias: string | null
  transfer_notes: string | null
  tenant_id: string | null
  created_at: string
  updated_at: string
}

export interface SandboxInfo {
  sandbox: boolean
  message?: string
  test_cards?: Array<{
    brand: string
    number: string
    cvc: string
    expiry: string
    name: string
    result: string
  }>
  instructions?: string
}

export interface CheckoutStatus {
  status: string
  email?: string
  business_name?: string
  is_free?: boolean
}

const checkoutApi = {
  getPlans: (): Promise<PublicPlan[]> =>
    apiClient.get('/checkout/plans').then((r: any) => Array.isArray(r.data) ? r.data : []),

  startCheckout: (payload: StartCheckoutPayload): Promise<CheckoutResult> =>
    apiClient.post('/checkout/start', payload).then((r) => r.data),

  getStatus: (pendingId: string): Promise<CheckoutStatus> =>
    apiClient.get(`/checkout/status/${pendingId}`).then((r) => r.data),

  confirmTransfer: (data: {
    pending_id: string
    transfer_alias: string
    transfer_notes?: string
  }): Promise<{ message: string }> =>
    apiClient.post('/checkout/confirm-transfer', data).then((r) => r.data),

  getSandboxInfo: (): Promise<SandboxInfo> =>
    apiClient.get('/checkout/sandbox-info').then((r) => r.data),

  getManualPendingList: (): Promise<PendingSubscriptionItem[]> =>
    apiClient.get('/checkout/admin/manual-pending').then((r) => Array.isArray(r.data) ? r.data : []),

  adminApprovePending: (pendingId: string): Promise<{ message: string }> =>
    apiClient.post(`/checkout/admin/approve/${pendingId}`).then((r) => r.data),
}

export default checkoutApi

