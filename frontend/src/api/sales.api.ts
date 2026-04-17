import apiClient from '@api/client'
import type { Customer, CashRegister, Sale, CreateSaleDto, ListSalesQuery, SalesListResponse, PaymentAccount, CreatePaymentAccountDto } from './sales.types'

export default {
  // ==========================================
  // CAJA REGISTRADORA
  // ==========================================
  
  getActiveRegister: async (branchId: string): Promise<CashRegister | null> => {
    const res = await apiClient.get('/sales/cash-register/active', { params: { branch_id: branchId } })
    // Retorna string vacio si Nest devuelve 200 pero sin contenido, lo forzamos a null
    return res.data || null
  },

  openRegister: async (branchId: string, openingBalance: number): Promise<CashRegister> => {
    const res = await apiClient.post('/sales/cash-register/open', { branch_id: branchId, opening_balance: openingBalance })
    return res.data
  },

  closeRegister: async (branchId: string, closingBalance: number): Promise<CashRegister> => {
    const res = await apiClient.post('/sales/cash-register/close', 
      { closing_balance: closingBalance }, 
      { params: { branch_id: branchId } }
    )
    return res.data
  },

  // ==========================================
  // VENTAS (POS)
  // ==========================================

  createSale: async (data: CreateSaleDto): Promise<Sale> => {
    const res = await apiClient.post('/sales', data)
    return res.data
  },

  verifySalePayment: async (id: string): Promise<Sale> => {
    const res = await apiClient.patch(`/sales/${id}/verify-payment`)
    return res.data
  },

  listSales: async (query: ListSalesQuery = {}): Promise<SalesListResponse> => {
    const res = await apiClient.get('/sales', { params: query })
    return res.data
  },

  // ==========================================
  // CLIENTES (Customers / Fiados)
  // ==========================================

  getCustomers: async (): Promise<Customer[]> => {
    const res = await apiClient.get('/sales/customers')
    return res.data
  },

  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    const res = await apiClient.post('/sales/customers', data)
    return res.data
  },

  updateCustomer: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const res = await apiClient.patch(`/sales/customers/${id}`, data)
    return res.data
  },

  payDebt: async (id: string, amount: number): Promise<Customer> => {
    const res = await apiClient.post(`/sales/customers/${id}/pay`, { amount })
    return res.data
  },

  revertSalePayment: async (id: string): Promise<Sale> => {
    const res = await apiClient.patch(`/sales/${id}/revert-payment`)
    return res.data
  },

  uploadVoucher: async (id: string, file: File): Promise<Sale> => {
    const formData = new FormData()
    formData.append('image', file)
    const res = await apiClient.post(`/sales/${id}/voucher`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  // ==========================================
  // CUENTAS DE PAGO (Payment Accounts)
  // ==========================================

  getPaymentAccounts: async (): Promise<PaymentAccount[]> => {
    const res = await apiClient.get('/sales/payment-accounts')
    return res.data
  },

  createPaymentAccount: async (data: CreatePaymentAccountDto): Promise<PaymentAccount> => {
    const res = await apiClient.post('/sales/payment-accounts', data)
    return res.data
  },

  updatePaymentAccount: async (id: string, data: Partial<CreatePaymentAccountDto>): Promise<PaymentAccount> => {
    const res = await apiClient.patch(`/sales/payment-accounts/${id}`, data)
    return res.data
  },

  deletePaymentAccount: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/sales/payment-accounts/${id}`)
    return res.data
  },
}


