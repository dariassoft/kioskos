import apiClient from './client'
import type {
  AfipCredentials,
  SaveAfipCredentialsDto,
  ElectronicInvoice,
  GenerateInvoiceDto,
  TestConnectionResponse,
  ListInvoicesResponse,
} from './afip.types'

const BASE = '/electronic-invoicing'

// ==========================================
// CREDENCIALES ARCA
// ==========================================

export const afipCredentialsApi = {
  get: (): Promise<AfipCredentials> =>
    apiClient.get(`${BASE}/credentials`).then((r) => r.data),

  save: (dto: SaveAfipCredentialsDto): Promise<{ message: string; is_configured: boolean }> =>
    apiClient.post(`${BASE}/credentials`, dto).then((r) => r.data),

  test: (): Promise<TestConnectionResponse> =>
    apiClient.get(`${BASE}/credentials/test`).then((r) => r.data),
}

// ==========================================
// FACTURAS ELECTRÓNICAS
// ==========================================

export const afipInvoicesApi = {
  list: (page = 1, limit = 20): Promise<ListInvoicesResponse> =>
    apiClient.get(`${BASE}/invoices`, { params: { page, limit } }).then((r) => r.data),

  getById: (id: string): Promise<ElectronicInvoice> =>
    apiClient.get(`${BASE}/invoices/${id}`).then((r) => r.data),

  generate: (dto: GenerateInvoiceDto): Promise<ElectronicInvoice> =>
    apiClient.post(`${BASE}/invoices`, dto).then((r) => r.data),

  downloadPdf: (id: string): Promise<Blob> =>
    apiClient.get(`${BASE}/invoices/${id}/pdf`, { responseType: 'blob' }).then((r) => r.data),
}

