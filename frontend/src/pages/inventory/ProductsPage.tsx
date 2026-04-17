import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Search, Edit2, Trash2, X, Loader2,
  Package, ChevronLeft, ChevronRight, Camera,
} from 'lucide-react'
import {
  useProducts, useCreateProduct, useUpdateProduct,
  useDeleteProduct, useCategories, useUnits,
  useUploadProductImage,
} from '@hooks/useInventory'
import type { Product } from '@api/inventory.types'

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().optional(),
  barcode: z.string().optional(),
  internal_code: z.string().optional(),
  category_id: z.string().optional(),
  unit_id: z.string().optional(),
  cost_price: z.coerce.number().min(0).optional(),
  min_stock_alert: z.coerce.number().min(0).optional(),
  image_url: z.string().optional(),
})
type ProductForm = z.infer<typeof productSchema>

// ==========================================
// MODAL — Crear / Editar producto
// ==========================================
function ProductModal({
  product,
  onClose,
}: {
  product?: Product
  onClose: () => void
}) {
  const { data: categories = [] } = useCategories()
  const { data: units = [] } = useUnits()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          barcode: product.barcode,
          internal_code: product.internal_code,
          category_id: product.category_id,
          unit_id: product.unit_id,
          cost_price: product.cost_price,
          min_stock_alert: product.min_stock_alert,
          image_url: product.image_url ?? '',
        }
      : {
          image_url: '',
          min_stock_alert: 5,
        },
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url ?? null)
  const uploadImage = useUploadProductImage()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const onSubmit = async (data: ProductForm) => {
    const onSuccessAction = async (savedProduct: Product) => {
      if (selectedFile) {
        await uploadImage.mutateAsync({ productId: savedProduct.id, file: selectedFile })
      }
      onClose()
    }

    if (product) {
      updateProduct.mutate({ id: product.id, data }, { onSuccess: onSuccessAction })
    } else {
      createProduct.mutate(data as any, { onSuccess: onSuccessAction })
    }
  }

  const isPending = createProduct.isPending || updateProduct.isPending

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-4.5 h-4.5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">
              {product ? 'Editar producto' : 'Nuevo producto'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Imagen del producto */}
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors relative group">
            {previewUrl ? (
              <img
                src={previewUrl.startsWith('http') || previewUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${previewUrl}` : previewUrl}
                alt="Vista previa"
                className="w-32 h-32 object-cover rounded-lg shadow-md"
              />
            ) : (
              <div className="w-32 h-32 bg-background rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                <Camera className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-[10px]">Sin foto</span>
              </div>
            )}
            <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl transition-opacity">
              <span className="text-white text-xs font-medium bg-primary px-3 py-1.5 rounded-full shadow-lg">
                {previewUrl ? 'Cambiar foto' : 'Subir foto'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Imagen del producto</p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Ej: Leche La Serenísima 1L"
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Código de barras + Código interno */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Código de barras (EAN)
              </label>
              <input
                {...register('barcode')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="7790040913498"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Código interno
              </label>
              <input
                {...register('internal_code')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="PRD-001"
              />
            </div>
          </div>

          {/* Categoría + Unidad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categoría</label>
              <select
                {...register('category_id')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Unidad</label>
              <select
                {...register('unit_id')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Sin unidad</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Precio de costo + Stock Mínimo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Precio de costo ($)
              </label>
              <input
                {...register('cost_price')}
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Stock Mínimo (Alerta)
              </label>
              <input
                {...register('min_stock_alert')}
                type="number"
                step="1"
                min="0"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Ej: 5"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Descripción (opcional)
            </label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="Descripción breve del producto"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-border rounded-lg text-sm font-medium
                         hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || uploadImage.isPending}
              className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm
                         font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors
                         flex items-center justify-center gap-2"
            >
              {(isPending || uploadImage.isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {product ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==========================================
// PÁGINA DE PRODUCTOS
// ==========================================
export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()

  const { data, isLoading } = useProducts({ search, page, limit: 20 })
  const deleteProduct = useDeleteProduct()

  const products = data?.data ?? []
  const totalPages = data?.pages ?? 1
  const total = data?.total ?? 0

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(undefined)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nombre, EAN o código..."
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <span className="text-sm text-muted-foreground hidden sm:block">
          {total} productos
        </span>
        <button
          onClick={() => { setEditingProduct(undefined); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground
                     rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors ml-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo producto</span>
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6">
            <Package className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">
              {search ? 'Sin resultados para tu búsqueda' : 'No hay productos todavía'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!search && 'Crea tu primer producto para empezar.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Producto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Categoría</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Código</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Precio</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => {
                    const defaultPrice = product.prices?.find((p) => p.price_list?.is_default)
                    return (
                      <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                              {product.image_url ? (
                                <img
                                  src={`${import.meta.env.VITE_API_URL}${product.image_url}`}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-muted-foreground/50" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{product.name}</p>
                              {product.unit && (
                                <p className="text-xs text-muted-foreground">{product.unit.abbreviation}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {product.category ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                background: product.category.color
                                  ? `${product.category.color}20`
                                  : 'var(--muted)',
                                color: product.category.color ?? 'var(--muted-foreground)',
                              }}
                            >
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground font-mono text-xs">
                          {product.barcode || product.internal_code || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {defaultPrice
                            ? `$${Number(defaultPrice.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                            : <span className="text-muted-foreground text-xs font-normal">Sin precio</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Desactivar "${product.name}"?`)) {
                                  deleteProduct.mutate(product.id)
                                }
                              }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Desactivar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Página {page} de {totalPages} · {total} resultados
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
