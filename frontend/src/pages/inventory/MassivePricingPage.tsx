import { useState } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, Percent, 
  Filter, AlertCircle, CheckCircle2, Loader2, Package, Tag, User 
} from 'lucide-react'
import { useCategories, useBulkUpdatePrices } from '@hooks/useInventory'
import { useSuppliers } from '@hooks/usePurchases'
import { PriceAdjustmentType } from '@api/inventory.types'

export default function MassivePricingPage() {
  const { data: categories = [] } = useCategories()
  const { data: suppliers = [] } = useSuppliers()
  const bulkUpdate = useBulkUpdatePrices()

  const [filters, setFilters] = useState({
    category_id: '',
    supplier_id: '',
    brand: '',
  })

  const [adjustment, setAdjustment] = useState({
    type: PriceAdjustmentType.PERCENTAGE,
    value: 0,
  })

  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    if (adjustment.value === 0) return
    
    if (!confirm('¿Estás seguro de aplicar este cambio de precios masivo? Esta acción no se puede deshacer.')) {
      return
    }

    setIsApplying(true)
    try {
      await bulkUpdate.mutateAsync({
        ...filters,
        adjustment_type: adjustment.type,
        value: adjustment.value,
      })
      // Reset after success
      setAdjustment({ ...adjustment, value: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">Gestión Masiva de Precios</h2>
          <p className="text-sm text-primary/70 mt-1">
            Ajusta los precios de múltiples productos simultáneamente. 
            Puedes aplicar aumentos o descuentos por categoría, proveedor o marca.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paso 1: Filtros */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-muted/30">1</div>
            <h3 className="font-bold text-foreground">Definir Alcance</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Categoría
              </label>
              <select 
                value={filters.category_id}
                onChange={(e) => setFilters(f => ({ ...f, category_id: e.target.value }))}
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <User className="w-3 h-3" /> Proveedor
              </label>
              <select 
                value={filters.supplier_id}
                onChange={(e) => setFilters(f => ({ ...f, supplier_id: e.target.value }))}
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todos los proveedores</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <Package className="w-3 h-3" /> Marca
              </label>
              <input 
                value={filters.brand}
                onChange={(e) => setFilters(f => ({ ...f, brand: e.target.value }))}
                placeholder="Ej: Coca-Cola, Arcor..."
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 italic">Deja vacío para afectar a todos los productos</p>
            </div>
          </div>
        </div>

        {/* Paso 2: Ajuste */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-muted/30">2</div>
            <h3 className="font-bold text-foreground">Definir Ajuste</h3>
          </div>

          <div className="space-y-6">
            <div className="bg-muted/30 p-2 rounded-2xl flex gap-1">
              <button 
                onClick={() => setAdjustment(a => ({ ...a, type: PriceAdjustmentType.PERCENTAGE }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${adjustment.type === PriceAdjustmentType.PERCENTAGE ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                <Percent className="w-4 h-4" /> Porcentaje
              </button>
              <button 
                onClick={() => setAdjustment(a => ({ ...a, type: PriceAdjustmentType.FIXED }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${adjustment.type === PriceAdjustmentType.FIXED ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                <DollarSign className="w-4 h-4" /> Valor Fijo
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                Valor del cambio {adjustment.type === PriceAdjustmentType.PERCENTAGE ? '(%)' : '($)'}
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={adjustment.value}
                  onChange={(e) => setAdjustment(a => ({ ...a, value: Number(e.target.value) }))}
                  className={`w-full px-6 py-4 text-3xl font-black text-center border-2 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all ${adjustment.value > 0 ? 'border-emerald-500/30 text-emerald-600' : adjustment.value < 0 ? 'border-destructive/30 text-destructive' : 'border-border'}`}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20">
                  {adjustment.value > 0 ? <TrendingUp className="w-10 h-10 text-emerald-500" /> : <TrendingDown className="w-10 h-10 text-destructive" />}
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground font-medium">
                {adjustment.value > 0 
                  ? `Se aplicará un AUMENTO del ${Math.abs(adjustment.value)}${adjustment.type === PriceAdjustmentType.PERCENTAGE ? '%' : ' pesos'}`
                  : adjustment.value < 0
                  ? `Se aplicará un DESCUENTO del ${Math.abs(adjustment.value)}${adjustment.type === PriceAdjustmentType.PERCENTAGE ? '%' : ' pesos'}`
                  : 'Ingresa un valor positivo para aumentar o negativo para disminuir'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmación Final */}
      <div className="bg-card border-2 border-primary/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-lg">Confirmar actualización</h4>
            <p className="text-sm text-muted-foreground">Esta operación afectará a todos los productos que coincidan con los filtros seleccionados.</p>
          </div>
        </div>

        <button 
          onClick={handleApply}
          disabled={isApplying || adjustment.value === 0}
          className="w-full md:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
        >
          {isApplying ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-6 h-6" />
              Aplicar Cambios ahora
            </>
          )}
        </button>
      </div>
    </div>
  )
}
