import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { afipCredentialsApi, afipInvoicesApi } from '@api/afip.api'

// ==========================================
// CREDENCIALES ARCA
// ==========================================

export function useAfipCredentials() {
  return useQuery({
    queryKey: ['afip', 'credentials'],
    queryFn: afipCredentialsApi.get,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useSaveAfipCredentials() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: afipCredentialsApi.save,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['afip', 'credentials'] }),
  })
}

export function useTestAfipConnection() {
  return useMutation({
    mutationFn: afipCredentialsApi.test,
  })
}

// ==========================================
// FACTURAS ELECTRÓNICAS
// ==========================================

export function useAfipInvoices(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['afip', 'invoices', page, limit],
    queryFn: () => afipInvoicesApi.list(page, limit),
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

export function useAfipInvoice(id: string | null) {
  return useQuery({
    queryKey: ['afip', 'invoices', id],
    queryFn: () => afipInvoicesApi.getById(id!),
    enabled: !!id,
  })
}

export function useGenerateAfipInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: afipInvoicesApi.generate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['afip', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['afip', 'credentials'] })
    },
  })
}

