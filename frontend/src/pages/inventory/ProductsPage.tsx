import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Search, Edit2, Trash2, X, Loader2,
  Package, ChevronLeft, ChevronRight, Camera,
  Award
} from 'lucide-react'
import {
  useProducts, useCreateProduct, useUpdateProduct,
  useDeleteProduct, useCategories, useUnits,
  useBrands, useCreateBrand,
  useUploadProductImage,
} from '@hooks/useInventory'
import { useSuppliers, useCreateSupplier } from '@hooks/usePurchases'
import type { Product, Brand, Category, Unit } from '@api/inventory.types'
import type { Supplier } from '@api/purchases.types'
import toast from 'react-hot-toast'

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
  brand_id: z.string().optional(),
  supplier_id: z.string().optional(),
  sale_price: z.coerce.number().min(0).optional(),
  sale_margin: z.coerce.number().optional(),
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
  const { data: suppliers = [] } = useSuppliers()
  const { data: brands = [] } = useBrands()
  
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const createSupplier = useCreateSupplier()
  const createBrand = useCreateBrand()
  const uploadImage = useUploadProductImage()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: (() => {
      if (!product) return { image_url: '', min_stock_alert: 5 }
      
      const defaultPrice = product.prices?.find(p => p.price_list?.is_default) || product.prices?.[0]
      
      return {
        name: product.name,
        description: product.description,
        barcode: product.barcode,
        internal_code: product.internal_code,
        category_id: product.category_id,
        unit_id: product.unit_id,
        cost_price: product.cost_price,
        min_stock_alert: product.min_stock_alert,
        image_url: product.image_url ?? '',
        brand_id: product.brand_id ?? '',
        supplier_id: product.supplier_id ?? '',
        sale_price: defaultPrice ? Number(defaultPrice.price) : 0,
        sale_margin: product.cost_price > 0 && defaultPrice 
          ? Number((((Number(defaultPrice.price) - product.cost_price) / product.cost_price) * 100).toFixed(2))
          : 35
      }
    })(),
  })

  // Estado UI
  const [priceType, setPriceType] = useState<'value' | 'percent'>('value')
  const [showQuickSupplier, setShowQuickSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [showQuickBrand, setShowQuickBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url ?? null)

  const watchedCost = watch('cost_price') || 0
  const watchedSale = watch('sale_price') || 0
  const watchedMargin = watch('sale_margin') || 0

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleQuickSupplier = async () => {
    if (!newSupplierName.trim()) return
    try {
      const res = await createSupplier.mutateAsync({ name: newSupplierName })
      if (res?.id) {
        setValue('supplier_id', res.id)
        setShowQuickSupplier(false)
        setNewSupplierName('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleQuickBrand = async () => {
    if (!newBrandName.trim()) return
    try {
      const res = await createBrand.mutateAsync({ name: newBrandName })
      if (res?.id) {
        setValue('brand_id', res.id)
        setShowQuickBrand(false)
        setNewBrandName('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSuggestMargin = () => {
    setValue('sale_margin', 35)
    if (watchedCost > 0) {
      const suggestedPrice = Number(watchedCost) * 1.35
      setValue('sale_price', Number(suggestedPrice.toFixed(2)))
    }
    setPriceType('percent')
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
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">
              {product ? 'Editar producto' : 'Nuevo producto'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
          {/* Imagen */}
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
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Imagen del producto</p>
          </div>

          <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nombre <span className="text-destructive">*</span></label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/30"
                placeholder="Ej: Leche La Serenísima 1L"
              />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* MARCA Y PROVEEDOR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                     <Award className="w-3 h-3" /> Marca
                  </label>
                  <button type="button" onClick={() => setShowQuickBrand(!showQuickBrand)} className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tighter">
                    {showQuickBrand ? 'Cerrar' : '+ Nueva'}
                  </button>
                </div>
                {showQuickBrand ? (
                  <div className="flex gap-1 animate-scale-in">
                    <input
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-2 bg-background border border-primary/50 rounded-xl text-xs focus:ring-2 focus:ring-primary/20"
                      placeholder="Nombre..."
                      autoFocus
                    />
                    <button type="button" onClick={handleQuickBrand} className="px-3 bg-primary text-white rounded-xl text-xs font-bold shadow-sm">OK</button>
                  </div>
                ) : (
                  <select
                    {...register('brand_id')}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm truncate"
                  >
                    <option value="">Sin marca</option>
                    {brands.map((b: Brand) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest inline-flex items-center gap-1">
                    Proveedor
                  </label>
                  <button type="button" onClick={() => setShowQuickSupplier(!showQuickSupplier)} className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tighter">
                    {showQuickSupplier ? 'Cerrar' : '+ Nuevo'}
                  </button>
                </div>
                {showQuickSupplier ? (
                  <div className="flex gap-1 animate-scale-in">
                    <input
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-2 bg-background border border-primary/50 rounded-xl text-xs focus:ring-2 focus:ring-primary/20"
                      placeholder="Nombre..."
                      autoFocus
                    />
                    <button type="button" onClick={handleQuickSupplier} className="px-3 bg-primary text-white rounded-xl text-xs font-bold shadow-sm">OK</button>
                  </div>
                ) : (
                  <select
                    {...register('supplier_id')}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm truncate"
                  >
                    <option value="">Sin proveedor</option>
                    {suppliers.map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* CÓDIGOS */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Código EAN (Barras)</label>
                <input 
                  {...register('barcode')} 
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm font-mono" 
                  placeholder="779..." 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Código Interno</label>
                <input 
                  {...register('internal_code')} 
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm font-mono" 
                  placeholder="PROD-001" 
                />
              </div>
            </div>

            {/* Categoría y Unidad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Categoría</label>
                <select {...register('category_id')} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm">
                  <option value="">Sin categoría</option>
                  {categories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Unidad</label>
                <select {...register('unit_id')} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm">
                  {units.map((u: Unit) => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
                </select>
              </div>
            </div>

            {/* PRECIOS */}
            <div className="p-5 bg-muted/20 border border-border rounded-2xl space-y-4 shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Costo Unitario ($)</label>
                  <input
                    {...register('cost_price')}
                    type="number" step="0.01"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-base font-bold text-foreground focus:ring-2 focus:ring-primary/20"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Venta</label>
                    <div className="flex bg-background border border-border rounded-lg p-0.5 scale-90">
                      <button type="button" onClick={() => setPriceType('value')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${priceType === 'value' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}>$</button>
                      <button type="button" onClick={() => setPriceType('percent')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${priceType === 'percent' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}>%</button>
                    </div>
                  </div>

                  {priceType === 'value' ? (
                    <input
                      {...register('sale_price')}
                      type="number" step="0.01"
                      className="w-full px-4 py-2.5 bg-background border-2 border-primary/30 text-primary rounded-xl text-base font-bold focus:ring-4 focus:ring-primary/10"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="relative">
                      <input
                        {...register('sale_margin')}
                        type="number" step="0.25"
                        className="w-full pr-10 pl-4 py-2.5 bg-background border-2 border-primary/30 text-primary rounded-xl text-base font-bold focus:ring-4 focus:ring-primary/10"
                        placeholder="35"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-primary/50">%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] font-medium leading-tight">
                  {priceType === 'value' && watchedCost > 0 && watchedSale > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-muted-foreground uppercase tracking-tighter">Utilidad:</span> 
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">${(watchedSale - watchedCost).toFixed(2)} ({(((watchedSale - watchedCost) / watchedCost) * 100).toFixed(1)}%)</span>
                    </span>
                  )}
                  {priceType === 'percent' && watchedCost > 0 && watchedMargin > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-muted-foreground uppercase tracking-tighter">Sugerido:</span> 
                      <span className="text-primary font-bold bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">${(watchedCost * (1 + watchedMargin / 100)).toFixed(2)}</span>
                    </span>
                  )}
                </div>
                <button type="button" onClick={handleSuggestMargin} className="text-[10px] font-black uppercase text-primary hover:text-primary/80 transition-colors drop-shadow-sm">Aplicar +35%</button>
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Alerta Stock Mínimo</label>
               <input {...register('min_stock_alert')} type="number" className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold" />
            </div>
          </form>
        </div>

        {/* Footer Actions — Sticky */}
        <div className="p-5 border-t border-border bg-card/50 backdrop-blur-md rounded-b-2xl flex-shrink-0">
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 border border-border rounded-2xl text-sm font-bold hover:bg-accent transition-all">Cancelar</button>
            <button
              form="product-form"
              type="submit"
              disabled={isPending || uploadImage.isPending}
              className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {(isPending || uploadImage.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {product ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </div>
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

  const { data, isLoading } = useProducts({ search, page, limit: 12 })
  const deleteProduct = useDeleteProduct()

  const products = data?.data ?? []
  const totalPages = data?.pages ?? 1

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(undefined)
  }

  const handleDeleteConfirmation = (product: Product) => {
    toast((t: any) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">¿Eliminar producto?</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{product.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-bold hover:bg-muted/80 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              deleteProduct.mutate(product.id)
              toast.dismiss(t.id)
            }}
            className="flex-1 px-3 py-1.5 bg-destructive text-white rounded-lg text-xs font-bold hover:bg-destructive/90 transition-colors shadow-sm"
          >
            Eliminar
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'bottom-center',
      className: 'bg-card border border-border rounded-2xl shadow-2xl p-0 overflow-hidden min-w-[280px]',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
         <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nombre, EAN o marca..."
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <button
          onClick={() => { setEditingProduct(undefined); setShowModal(true) }}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center animate-fade-in shadow-sm">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Sin productos</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            {search ? 'Prueba con otros términos de búsqueda.' : 'Aún no tienes productos registrados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product: Product) => {
            const defaultPrice = product.prices?.find((p: any) => p.price_list?.is_default)
            return (
              <div key={product.id} className="group bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {product.image_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${product.image_url}`}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/20 italic">
                       <Package className="w-12 h-12 mb-2" />
                       <span className="text-[10px] uppercase font-bold tracking-tighter">Sin imagen</span>
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 bg-white/90 backdrop-blur-sm text-foreground rounded-full shadow-lg hover:bg-primary hover:text-white transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirmation(product)}
                      className="p-2 bg-white/90 backdrop-blur-sm text-destructive rounded-full shadow-lg hover:bg-destructive hover:text-white transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {product.category && (
                     <div className="absolute bottom-3 left-3">
                       <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md border border-white/20"
                        style={{ 
                          backgroundColor: `${product.category.color}CC`,
                          color: '#fff' 
                        }}
                      >
                        {product.category.name}
                      </span>
                     </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="font-bold text-foreground line-clamp-1 text-sm">{product.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                       <Award className="w-3 h-3 text-primary" />
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        {product.brand?.name || 'Genérico'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Precio</span>
                      <span className="text-lg font-black text-primary">
                        {defaultPrice
                          ? `$${Number(defaultPrice.price).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
                          : <span className="text-muted-foreground text-sm font-normal">—</span>}
                      </span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Code</span>
                      <p className="text-[10px] font-mono font-medium truncate max-w-[80px] bg-muted px-1 rounded">{product.internal_code || product.barcode || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Hoja {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 400) }}
              disabled={page === 1}
              className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 400) }}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

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
