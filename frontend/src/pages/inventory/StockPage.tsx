import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertTriangle, BarChart3, Plus, Search, Loader2, X, Store,
} from 'lucide-react'
import { useBranches, useStockByBranch, useLowStock, useAddStock } from '@hooks/useInventory'
import type { Inventory } from '@api/inventory.types'

const addStockSchema = z.object({
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  min_stock_alert: z.coerce.number().min(0).optional(),
})
type AddStockForm = z.infer<typeof addStockSchema>

function AddStockModal({
  item,
  branchId,
  onClose,
}: { item: Inventory; branchId: string; onClose: () => void }) {
  const addStock = useAddStock()
  const { register, handleSubmit, formState: { errors } } = useForm<AddStockForm>({
    resolver: zodResolver(addStockSchema),
    defaultValues: { min_stock_alert: item.min_stock_alert },
  })

  const onSubmit = (data: AddStockForm) => {
    addStock.mutate(
      { productId: item.product_id, data: { branch_id: branchId, ...data } },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Agregar stock — {item.product?.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Stock actual</p>
            <p className="text-2xl font-bold text-foreground">
              {item.stock_quantity} <span className="text-sm font-normal text-muted-foreground">{item.product?.unit?.abbreviation ?? 'un'}</span>
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
  const [addStockItem, setAddStockItem] = useState<Inventory | null>(null)

  const { data: branches = [], isLoading: loadingBranches } = useBranches()
  const { data: stockItems = [], isLoading: loadingStock } = useStockByBranch(selectedBranch)
  const { data: lowStock = [] } = useLowStock()

  const filtered = stockItems.filter((i) =>
    !search || i.product?.name.toLowerCase().includes(search.toLowerCase()),
  )

  const isLoading = loadingBranches || loadingStock

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
      <div className="flex flex-wrap gap-3 items-center">
        {/* Selector de sucursal */}
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm
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
              placeholder="Buscar producto..."
              className="pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
            />
          </div>
        )}
      </div>

      {/* Tabla de stock */}
      {!selectedBranch ? (
        <div className="flex flex-col items-center justify-center h-48 bg-card border-2 border-dashed border-border rounded-xl">
          <Store className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Selecciona una sucursal para ver el stock</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-card border border-border rounded-xl">
          <BarChart3 className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-foreground font-medium">Sin stock registrado en esta sucursal</p>
          <p className="text-xs text-muted-foreground mt-1">Agrega stock desde la lista de productos</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Producto</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Stock actual</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Mínimo</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Estado</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => {
                const isLow = Number(item.stock_quantity) <= Number(item.min_stock_alert)
                return (
                  <tr key={item.id} className={`hover:bg-muted/30 transition-colors ${isLow ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.product?.name}</p>
                      {item.product?.barcode && (
                        <p className="text-xs text-muted-foreground font-mono">{item.product.barcode}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold text-lg ${isLow ? 'text-amber-500' : 'text-foreground'}`}>
                        {Number(item.stock_quantity).toLocaleString('es-AR')}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {item.product?.unit?.abbreviation ?? 'un'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground text-xs">
                      {item.min_stock_alert}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {isLow ? (
                        <span className="badge-past-due"><AlertTriangle className="w-3 h-3" /> Bajo</span>
                      ) : (
                        <span className="badge-active">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setAddStockItem(item)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary
                                   rounded-md hover:bg-primary/20 transition-colors font-medium"
                      >
                        <Plus className="w-3 h-3" />
                        Stock
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
          item={addStockItem}
          branchId={selectedBranch}
          onClose={() => setAddStockItem(null)}
        />
      )}
    </div>
  )
}
