import { useState } from 'react'
import { Sparkles, Package, AlertTriangle, ArrowRight, X, Loader2, Factory, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack_react-query'
import { api } from '@api/client'
import { useBranchStore } from '@store/branch.store'

interface ReplenishmentItem {
  id: string
  stock_quantity: number
  min_stock_alert: number
  product: {
    id: string
    name: string
    cost_price: number
    image_url: string | null
  }
}

export default function ReplenishmentAssistant({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { activeBranch } = useBranchStore()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const { data: items = [], isLoading } = useQuery<ReplenishmentItem[]>({
    queryKey: ['inventory', 'replenishment', activeBranch?.id],
    queryFn: async () => {
      const resp = await api.get(`/inventory/stock/replenishment?branch_id=${activeBranch?.id}`)
      return resp.data
    },
    enabled: isOpen && !!activeBranch?.id
  })

  if (!isOpen) return null

  const toggleItem = (id: string) => {
    const next = new Set(selectedItems)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedItems(next)
  }

  const handleGenerateOC = () => {
    // Aquí iría la lógica para abrir el modal de nueva OC pre-cargado
    alert('Función de generación de OC automática en desarrollo. Se pre-cargarán ' + selectedItems.size + ' productos.')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-3xl rounded-3xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden animate-slide-in-bottom">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-indigo-600/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Asistente de Reposición Inteligente</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Optimiza tus Órdenes de Compra</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 opacity-50">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="font-medium">Escaneando niveles de stock...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center p-20">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold">¡Todo en orden!</h3>
              <p className="text-muted-foreground">No hay productos por debajo del stock mínimo en esta sucursal.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">{items.length} Productos críticos detectados</span>
                <button 
                  onClick={() => setSelectedItems(new Set(items.map(i => i.id)))}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Seleccionar todos
                </button>
              </div>
              
              <div className="grid gap-3">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedItems.has(item.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-card hover:border-border-hover'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {item.product.image_url ? (
                        <img 
                          src={`${import.meta.env.VITE_API_URL}${item.product.image_url}`} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-bold">?</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm leading-tight">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground">Costo Sugerido: ${item.product.cost_price}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 text-destructive rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="text-xs font-black">{item.stock_quantity}/{item.min_stock_alert}</span>
                      </div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">CRÍTICO</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between bg-muted/20">
          <div className="text-sm">
            <span className="font-bold text-foreground">{selectedItems.size}</span>
            <span className="text-muted-foreground ml-1">productos seleccionados</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button 
              disabled={selectedItems.size === 0}
              onClick={handleGenerateOC}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none"
            >
              Generar O.C. Sugerida
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
