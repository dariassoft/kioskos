import { useQuery } from '@tanstack/react-query'
import { currentAccountsApi } from '@api/current-accounts.api'
import type { CurrentAccountType } from '@api/current-accounts.types'

export const useCurrentAccounts = (type: CurrentAccountType, search: string) => useQuery({
  queryKey: ['current-accounts', type, search],
  queryFn: () => currentAccountsApi.list(type, search),
})

export const useCurrentAccountDetail = (type: CurrentAccountType, id?: string) => useQuery({
  queryKey: ['current-account', type, id],
  queryFn: () => currentAccountsApi.detail(type, id as string),
  enabled: Boolean(id),
})
