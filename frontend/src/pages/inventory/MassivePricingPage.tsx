import { useState } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, Percent, 
  AlertCircle, CheckCircle2, Loader2, Package, Tag, User, Landmark, Award
} from 'lucide-react'
import { useCategories, useBrands, useBulkUpdatePrices } from '@hooks/useInventory'
import { useSuppliers } from '@hooks/usePurchases'
import { PriceAdjustmentType } from '@api/inventory.types'

export default function MassivePricingPage() {
  const { data: categories = [] } = useCategories()
  const { data: suppliers = [] } = useSuppliers()
  const { data: brands = [] } = useBrands()
  const bulkUpdate = useBulkUpdatePrices()

  const [filters, setFilters] = useState({
    category_id: '',
    supplier_id: '',
    brand_id: '',
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
        category_id: filters.category_id || undefined,
        supplier_id: filters.supplier_id || undefined,
        brand_id: filters.brand_id || undefined,
        adjustment_type: adjustment.type,
        value: adjustment.value,
      })
      setAdjustment({ ...adjustment, value: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
          <Landmark className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-amber-700">Gestión Masiva de Precios</h2>
          <p className="text-sm text-amber-700/70 mt-1">
            Ajusta los precios de múltiples productos simultáneamente. 
            Selecciona los filtros para definir qué productos se verán afectados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paso 1: Filtros */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-muted rounded-xl flex items-center justify-center text-xs font-black ring-4 ring-muted/30">1</div>
            <h3 className="font-bold text-foreground">Definir Alcance</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" /> Categoría
              </label>
              <select 
                value={filters.category_id}
                onChange={(e) => setFilters(f => ({ ...f, category_id: e.target.value }))}
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium"
              >
                <option value="">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <Award className="w-3.5 h-3.5" /> Marca
              </label>
              <select 
                value={filters.brand_id}
                onChange={(e) => setFilters(f => ({ ...f, brand_id: e.target.value }))}
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium"
              >
                <option value="">Todas las marcas</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Proveedor
              </label>
              <select 
                value={filters.supplier_id}
                onChange={(e) => setFilters(f => ({ ...f, supplier_id: e.target.value }))}
                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium"
              >
                <option value="">Todos los proveedores</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Paso 2: Ajuste */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-muted rounded-xl flex items-center justify-center text-xs font-black ring-4 ring-muted/30">2</div>
            <h3 className="font-bold text-foreground">Definir Ajuste</h3>
          </div>

          <div className="space-y-6 flex-1">
            <div className="bg-muted/30 p-1.5 rounded-2xl flex gap-1">
              <button 
                onClick={() => setAdjustment(a => ({ ...a, type: PriceAdjustmentType.PERCENTAGE }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adjustment.type === PriceAdjustmentType.PERCENTAGE ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                <Percent className="w-4 h-4" /> Porcentaje
              </button>
              <button 
                onClick={() => setAdjustment(a => ({ ...a, type: PriceAdjustmentType.FIXED }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adjustment.type === PriceAdjustmentType.FIXED ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                <DollarSign className="w-4 h-4" /> Valor Fijo
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-6">
              <div className="relative">
                <input 
                  type="number"
                  value={adjustment.value}
                  onChange={(e) => setAdjustment(a => ({ ...a, value: Number(e.target.value) }))}
                  className={`w-full px-6 py-6 text-4xl font-black text-center border-2 rounded-3xl focus:ring-8 focus:ring-primary/5 transition-all outline-none ${adjustment.value > 0 ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5' : adjustment.value < 0 ? 'border-destructive/30 text-destructive bg-destructive/5' : 'border-border'}`}
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-10">
                  {adjustment.value >= 0 ? <TrendingUp className="w-12 h-12 text-emerald-500" /> : <TrendingDown className="w-12 h-12 text-destructive" />}
                </div>
              </div>
              
              <div className={`p-4 rounded-2xl text-center border transition-all ${adjustment.value > 0 ? 'bg-emerald-50 border-emerald-100' : adjustment.value < 0 ? 'bg-destructive/5 border-destructive/10' : 'bg-muted/50 border-border'}`}>
                 <p className={`text-xs font-bold uppercase tracking-tight ${adjustment.value > 0 ? 'text-emerald-700' : adjustment.value < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {adjustment.value > 0 
                    ? `AUMENTO del ${Math.abs(adjustment.value)}${adjustment.type === PriceAdjustmentType.PERCENTAGE ? '%' : ' por unidad'}`
                    : adjustment.value < 0
                    ? `DESCUENTO del ${Math.abs(adjustment.value)}${adjustment.type === PriceAdjustmentType.PERCENTAGE ? '%' : ' por unidad'}`
                    : 'Ingresa un valor para continuar'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmación Final */}
      <div className="bg-card border border-border rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-primary/5 border-b-4 border-b-primary/20">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div>
            <h4 className="font-black text-foreground text-xl tracking-tight leading-tight">¿Confirmar actualización?</h4>
            <p className="text-sm text-muted-foreground mt-1">Los cambios se aplicarán instantáneamente.</p>
          </div>
        </div>

        <button 
          onClick={handleApply}
          disabled={isApplying || adjustment.value === 0}
          className="w-full md:w-auto px-12 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 transition-all flex items-center justify-center gap-3 group"
        >
          {isApplying ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Actualizar Precios
            </>
          )}
        </button>
      </div>
    </div>
  )
}
