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
    apiClient.get('/checkout/admin/manual-pending').then((r) => r.data),

  adminApprovePending: (pendingId: string): Promise<{ message: string }> =>
    apiClient.post(`/checkout/admin/approve/${pendingId}`).then((r) => r.data),
}

export default checkoutApi

