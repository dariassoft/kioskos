import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { afipCredentialsApi, afipInvoicesApi } from '@api/afip.api'
import type { SaveAfipCredentialsDto, GenerateInvoiceDto } from '@api/afip.types'
import toast from 'react-hot-toast'

export const useAfipCredentials = () => {
  return useQuery({
    queryKey: ['afip-credentials'],
    queryFn: () => afipCredentialsApi.get(),
  })
}

export const useSaveAfipCredentials = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: SaveAfipCredentialsDto) => afipCredentialsApi.save(dto),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['afip-credentials'] })
      toast.success(res.message)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al guardar credenciales')
    },
  })
}

export const useTestAfipConnection = () => {
  return useMutation({
    mutationFn: () => afipCredentialsApi.test(),
    onSuccess: (res) => {
      toast.success(res.message)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error en la conexión con ARCA')
    },
  })
}

export const useAfipInvoices = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['afip-invoices', page, limit],
    queryFn: () => afipInvoicesApi.list(page, limit),
  })
}

export const useGenerateInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: GenerateInvoiceDto) => afipInvoicesApi.generate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afip-invoices'] })
      toast.success('Factura electrónica emitida exitosamente')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al emitir factura')
    },
  })
}
