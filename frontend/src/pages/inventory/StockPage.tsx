import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertTriangle, BarChart3, Plus, Search, Loader2, X, Store,
} from 'lucide-react'
import { useBranches, useStockByBranch, useLowStock, useAddStock, useProducts } from '@hooks/useInventory'
import type { Inventory, Product } from '@api/inventory.types'

const addStockSchema = z.object({
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  min_stock_alert: z.coerce.number().min(0).optional(),
})
type AddStockForm = z.infer<typeof addStockSchema>

function AddStockModal({
  item,
  product,
  branchId,
  onClose,
}: { 
  item?: Inventory; 
  product?: Product;
  branchId: string; 
  onClose: () => void 
}) {
  const addStock = useAddStock()
  const displayProduct = item?.product || product;
  
  if (!displayProduct) return null;

  const { register, handleSubmit, formState: { errors } } = useForm<AddStockForm>({
    resolver: zodResolver(addStockSchema),
    defaultValues: { min_stock_alert: item?.min_stock_alert ?? displayProduct.min_stock_alert },
  })

  const onSubmit = (data: AddStockForm) => {
    addStock.mutate(
      { productId: displayProduct.id, data: { branch_id: branchId, ...data } },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">
            {item ? 'Agregar stock' : 'Inicializar stock'} — {displayProduct.name}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Stock actual en esta sucursal</p>
            <p className="text-2xl font-bold text-foreground">
              {item?.stock_quantity ?? 0} <span className="text-sm font-normal text-muted-foreground">{displayProduct.unit?.abbreviation ?? 'un'}</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Cantidad a agregar <span className="text-destructive">*</span>
            </label>
            <input
              {...register('quantity')}
              type="number"
              step="0.01"
              min="0.01"
              autoFocus
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="0"
            />
            {errors.quantity && <p className="text-destructive text-xs mt-1">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Alerta de stock mínimo
            </label>
            <input
              {...register('min_stock_alert')}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-accent">Cancelar</button>
            <button
              type="submit"
              disabled={addStock.isPending}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium
                         hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {addStock.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StockPage() {
  const [selectedBranch, setSelectedBranch] = useState('')
  const [search, setSearch] = useState('')
  const [addStockItem, setAddStockItem] = useState<{ item?: Inventory, product?: Product } | null>(null)
  const [isGlobalSearch, setIsGlobalSearch] = useState(false)

  const { data: branches = [], isLoading: loadingBranches } = useBranches()
  const { data: stockItems = [], isLoading: loadingStock } = useStockByBranch(selectedBranch)
  const { data: lowStock = [] } = useLowStock()
  
  // Búsqueda global si el usuario lo activa o no hay resultados locales
  const { data: globalProducts, isLoading: loadingGlobal } = useProducts({ 
    search, 
    limit: 10,
    page: 1 
  }, { enabled: isGlobalSearch && search.length > 2 })

  const filteredLocal = stockItems.filter((i) =>
    !search || i.product?.name.toLowerCase().includes(search.toLowerCase()),
  )

  const isLoading = loadingBranches || loadingStock || (isGlobalSearch && loadingGlobal)

  return (
    <div className="space-y-5">
      {/* Alertas de stock bajo */}
      {lowStock.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">
                {lowStock.length} producto{lowStock.length > 1 ? 's' : ''} con stock bajo
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowStock.slice(0, 5).map((item) => (
                  <span key={item.id} className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    {item.product?.name} — {item.stock_quantity} {item.product?.unit?.abbreviation ?? 'un'}
                  </span>
                ))}
                {lowStock.length > 5 && (
                  <span className="text-xs text-amber-600">+{lowStock.length - 5} más</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Selector de sucursal */}
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-xl text-sm font-bold
                         focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Seleccionar sucursal</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.is_main_branch ? '(Principal)' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedBranch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en esta sucursal..."
                className="pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
              />
            </div>
          )}
        </div>

        {selectedBranch && (
          <button
            onClick={() => setIsGlobalSearch(!isGlobalSearch)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              isGlobalSearch 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {isGlobalSearch ? 'Búsqueda Global Activa' : 'Activar Búsqueda Global'}
          </button>
        )}
      </div>

      {/* Tabla de stock */}
      {!selectedBranch ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border-2 border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-foreground font-bold">Selecciona una sucursal</p>
          <p className="text-xs text-muted-foreground mt-1">Para visualizar y gestionar el inventario local</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isGlobalSearch && search.length > 2 ? (
        /* VISTA DE BÚSQUEDA GLOBAL */
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Search className="w-4 h-4" />
            <h2 className="text-sm font-black uppercase tracking-widest">Resultados del Catálogo General</h2>
          </div>
          <div className="space-y-3">
            {globalProducts?.data.map((product: Product) => {
              const localEntry = stockItems.find(si => si.product_id === product.id)
              return (
                <div 
                  key={product.id} 
                  className="bg-card border border-border rounded-2xl p-4 hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded leading-none">
                        {product.barcode || product.internal_code || 'S/C'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 leading-none">
                        • {product.category?.name || 'Varios'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end sm:justify-start gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
                    {localEntry ? (
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-bold text-emerald-600">En stock: {localEntry.stock_quantity}</span>
                         <button
                           onClick={() => setAddStockItem({ item: localEntry })}
                           className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                         >
                           <Plus className="w-5 h-5" />
                         </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddStockItem({ product })}
                        className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                      >
                        Inicializar Stock
                      </button>
                    ) }
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : filteredLocal.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-3xl">
          <BarChart3 className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <p className="text-sm text-foreground font-bold">Sin resultados en esta sucursal</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center">
            {search 
              ? 'Prueba con otros términos o activa la Búsqueda Global para cargar nuevos artículos.' 
              : 'Esta sucursal aún no tiene inventario cargado.'}
          </p>
          {!isGlobalSearch && (
            <button 
              onClick={() => setIsGlobalSearch(true)}
              className="mt-6 text-primary text-xs font-black border-b border-primary hover:border-b-2 transition-all transition-all"
            >
              BUSCAR EN TODO EL CATÁLOGO
            </button>
          )}
        </div>
      ) : (
        /* VISTA DE STOCK LOCAL */
        <div className="bg-card border border-border rounded-3xl overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Articulo</th>
                <th className="text-right px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Existencias</th>
                <th className="text-right px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden md:table-cell">Mínimo</th>
                <th className="text-center px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden md:table-cell">Estado</th>
                <th className="px-6 py-4 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLocal.map((item) => {
                const isLow = Number(item.stock_quantity) <= Number(item.min_stock_alert)
                return (
                  <tr key={item.id} className={`hover:bg-muted/30 transition-colors ${isLow ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{item.product?.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 rounded">{item.product?.barcode || 'S/C'}</span>
                        <span className="text-[10px] text-muted-foreground/60">• {item.product?.category?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-lg font-black ${isLow ? 'text-amber-500' : 'text-primary'}`}>
                          {Number(item.stock_quantity).toLocaleString('es-AR')}
                        </span>
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">
                          {item.product?.unit?.abbreviation ?? 'un'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right hidden md:table-cell font-bold text-muted-foreground/50">
                      {item.min_stock_alert}
                    </td>
                    <td className="px-6 py-4 text-center hidden md:table-cell">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                          <AlertTriangle className="w-3 h-3" /> Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setAddStockItem({ item })}
                        className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary text-white transition-all shadow-sm flex items-center justify-center"
                        title="Ajustar Stock"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {addStockItem && (
        <AddStockModal
          item={addStockItem.item}
          product={addStockItem.product}
          branchId={selectedBranch}
          onClose={() => setAddStockItem(null)}
        />
      )}
    </div>
  )
}
