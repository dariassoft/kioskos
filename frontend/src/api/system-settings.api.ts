import apiClient from './client'

export interface SystemSetting {
  key: string
  value: string
  description?: string
}

const systemSettingsApi = {
  getSettings: (): Promise<SystemSetting[]> =>
    apiClient.get('/system-settings').then((r) => r.data),

  updateSetting: (key: string, value: string): Promise<SystemSetting> =>
    apiClient.patch(`/system-settings/${key}`, { value }).then((r) => r.data),

  getPublicInfo: (): Promise<Record<string, string>> =>
    apiClient.get('/system-settings/public-info').then((r) => r.data),
}

export default systemSettingsApi
