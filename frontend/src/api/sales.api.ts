import apiClient from '@api/client'
import type { Customer, CashRegister, Sale, CreateSaleDto } from './sales.types'

export const salesApi = {
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
}
