import { inventoryApi } from '@api/inventory.api'
import type { ProductQuery, PaginatedProducts, CreateBrandDto } from '@api/inventory.types'
import toast from 'react-hot-toast'

// ==========================================
// QUERIES
// ==========================================

export const useProducts = (params?: ProductQuery, options?: any) =>
  useQuery<PaginatedProducts>({
    queryKey: ['products', params],
    queryFn: () => inventoryApi.getProducts(params),
    ...options,
  })

export const useProduct = (id: string) =>
  useQuery({
    queryKey: ['product', id],
    queryFn: () => inventoryApi.getProduct(id),
    enabled: !!id,
  })

export const useBranches = () =>
  useQuery({
    queryKey: ['branches'],
    queryFn: inventoryApi.getBranches,
    staleTime: 1000 * 60 * 10, // 10 min (no cambian seguido)
  })

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: inventoryApi.getCategories,
    staleTime: 1000 * 60 * 10,
  })

export const useUnits = () =>
  useQuery({
    queryKey: ['units'],
    queryFn: inventoryApi.getUnits,
    staleTime: 1000 * 60 * 10,
  })

export const usePriceLists = () =>
  useQuery({
    queryKey: ['price-lists'],
    queryFn: inventoryApi.getPriceLists,
    staleTime: 1000 * 60 * 10,
  })

export const useStockByBranch = (branchId: string) =>
  useQuery({
    queryKey: ['stock', branchId],
    queryFn: () => inventoryApi.getStockByBranch(branchId),
    enabled: !!branchId,
  })

export const useLowStock = () =>
  useQuery({
    queryKey: ['low-stock'],
    queryFn: inventoryApi.getLowStock,
    refetchInterval: 1000 * 60 * 2, // Refetch cada 2 min
  })

// ==========================================
// MUTATIONS
// ==========================================

export const useCreateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inventoryApi.createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Producto creado correctamente')
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Error al crear el producto'),
  })
}

export const useUpdateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      inventoryApi.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['product', id] })
      toast.success('Producto actualizado')
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Error al actualizar'),
  })
}

export const useUploadProductImage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) =>
      inventoryApi.uploadProductImage(productId, file),
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['product', productId] })
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Error al subir la imagen'),
  })
}

export const useDeleteProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inventoryApi.deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Producto desactivado')
    },
  })
}

export const useSetPrice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: any }) =>
      inventoryApi.setPrice(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Precio actualizado')
    },
  })
}

export const useAddStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: any }) =>
      inventoryApi.addStock(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['low-stock'] })
      toast.success('Stock actualizado')
    },
  })
}

export const useCreateBranch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inventoryApi.createBranch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] })
      toast.success('Sucursal creada')
    },
  })
}

export const useCreateCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inventoryApi.createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoría creada')
    },
  })
}

export const useBulkUpdatePrices = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inventoryApi.bulkUpdatePrices,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success(`${res.updated} precios actualizados correctamente`)
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Error en la actualización masiva'),
  })
}

// ==========================================
// MARCAS
// ==========================================

export function useBrands() {
  return useQuery({
    queryKey: ['inventory', 'brands'],
    queryFn: () => inventoryApi.getBrands(),
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBrandDto) => inventoryApi.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'brands'] })
    },
  })
}
