import apiClient from '@api/client'
import type {
  CurrentAccountDetail,
  CurrentAccountsResponse,
  CurrentAccountType,
} from './current-accounts.types'

function normalizeSupplierDetail(data: any): CurrentAccountDetail {
  return {
    account_type: 'supplier',
    account: {
      id: data.supplier.id,
      name: data.supplier.name,
      phone: data.supplier.phone,
      email: data.supplier.email,
      balance: Number(data.balance),
      account_type: 'supplier',
    },
    balance: Number(data.balance),
    entries: (data.entries || []).map((entry: any) => ({
      ...entry,
      amount: Number(entry.amount),
      balance_effect: entry.direction === 'credit' ? 'increase' : 'decrease',
    })),
  }
}

export const currentAccountsApi = {
  list: async (type: CurrentAccountType, search = ''): Promise<CurrentAccountsResponse> => {
    const endpoint = type === 'customer'
      ? '/sales/customers/current-accounts'
      : '/purchases/suppliers/current-accounts'
    const response = await apiClient.get(endpoint, { params: { page: 1, limit: 100, search: search || undefined } })
    return response.data
  },

  detail: async (type: CurrentAccountType, id: string): Promise<CurrentAccountDetail> => {
    if (type === 'customer') {
      const response = await apiClient.get(`/sales/customers/${id}/current-account`)
      return response.data
    }
    const response = await apiClient.get(`/purchases/suppliers/${id}/current-account`)
    return normalizeSupplierDetail(response.data)
  },
}
