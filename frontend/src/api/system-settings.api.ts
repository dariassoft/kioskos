import apiClient from './client'

export interface SystemSetting {
  key: string
  value: string
  description?: string
}

export interface PlatformTransferAccount {
  id?: string
  name: string
  alias?: string
  cbu?: string
  holder?: string
  bank?: string
  active?: boolean
}

export interface PlatformPaymentConfig {
  mercadopago: {
    enabled: boolean
    public_key: string
    configured: boolean
  }
  transfer_accounts: PlatformTransferAccount[]
}

const systemSettingsApi = {
  getSettings: (): Promise<SystemSetting[]> =>
    apiClient.get('/system-settings').then((r) => r.data),

  updateSetting: (key: string, value: string): Promise<SystemSetting> =>
    apiClient.patch(`/system-settings/${key}`, { value }).then((r) => r.data),

  getPublicInfo: (): Promise<Record<string, string>> =>
    apiClient.get('/system-settings/public-info').then((r) => r.data),

  getPlatformPayments: (): Promise<PlatformPaymentConfig> =>
    apiClient.get('/system-settings/platform-payments').then((r) => r.data),

  updatePlatformPayments: (data: {
    mercadopago_enabled: boolean
    mercadopago_public_key: string
    mercadopago_access_token?: string
    transfer_accounts: PlatformTransferAccount[]
  }): Promise<PlatformPaymentConfig> =>
    apiClient.patch('/system-settings/platform-payments', data).then((r) => r.data),
}

export default systemSettingsApi
