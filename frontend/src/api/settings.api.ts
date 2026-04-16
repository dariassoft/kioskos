import apiClient from './client'
import type {
  Branch, UserItem, BusinessProfile,
  CreateBranchDto, UpdateBranchDto,
  CreateUserDto, UpdateUserDto, UpdateBusinessProfileDto,
  MercadopagoCredentials, SaveMercadopagoCredentialsDto,
} from './settings.types'
const BASE = '/settings'
// ==========================================
// SUCURSALES
// ==========================================
export const settingsBranchesApi = {
  list: (): Promise<Branch[]> =>
    apiClient.get(`${BASE}/branches`).then((r) => r.data),
  create: (dto: CreateBranchDto): Promise<Branch> =>
    apiClient.post(`${BASE}/branches`, dto).then((r) => r.data),
  update: (id: string, dto: UpdateBranchDto): Promise<Branch> =>
    apiClient.patch(`${BASE}/branches/${id}`, dto).then((r) => r.data),
  delete: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`${BASE}/branches/${id}`).then((r) => r.data),
}
// ==========================================
// USUARIOS
// ==========================================
export const settingsUsersApi = {
  list: (): Promise<UserItem[]> =>
    apiClient.get(`${BASE}/users`).then((r) => r.data),
  create: (dto: CreateUserDto): Promise<UserItem> =>
    apiClient.post(`${BASE}/users`, dto).then((r) => r.data),
  update: (id: string, dto: UpdateUserDto): Promise<UserItem> =>
    apiClient.patch(`${BASE}/users/${id}`, dto).then((r) => r.data),
}
// ==========================================
// PERFIL DEL NEGOCIO
// ==========================================
export const settingsBusinessApi = {
  get: (): Promise<BusinessProfile> =>
    apiClient.get(`${BASE}/business`).then((r) => r.data),
  update: (dto: UpdateBusinessProfileDto): Promise<BusinessProfile> =>
    apiClient.patch(`${BASE}/business`, dto).then((r) => r.data),
}

// ==========================================
// MERCADOPAGO
// ==========================================
export const settingsMercadopagoApi = {
  get: (): Promise<MercadopagoCredentials | null> =>
    apiClient.get(`${BASE}/mercadopago`).then((r) => r.data),
  save: (dto: SaveMercadopagoCredentialsDto): Promise<MercadopagoCredentials> =>
    apiClient.post(`${BASE}/mercadopago`, dto).then((r) => r.data),
}
