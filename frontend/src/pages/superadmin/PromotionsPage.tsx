import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@api/client'
import toast from 'react-hot-toast'
import { Plus, X, Edit2, Trash2, Gift, ToggleLeft, ToggleRight, Loader2, Calendar, Hash, Tag, Percent, DollarSign } from 'lucide-react'

export default function PromotionsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; promo: any | null }>({ open: false, promo: null })

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => (await apiClient.get('/billing/promotions')).data,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => (await apiClient.get('/billing/plans')).data,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/billing/promotions/${id}`),
    onSuccess: () => { toast.success('Promoción eliminada'); qc.invalidateQueries({ queryKey: ['promotions'] }) },
    onError: () => toast.error('Error al eliminar'),
  })

  const fmt = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v)
  const now = new Date()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-3">
            <Gift className="w-7 h-7 text-pink-500" /> Promociones
          </h1>
          <p className="text-sm text-slate-400 mt-1">Crea descuentos temporales para atraer nuevos suscriptores</p>
        </div>
        <button onClick={() => setModal({ open: true, promo: null })}
          className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" /> Nueva Promoción
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>
      ) : promos.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold">Sin promociones</p>
          <p className="text-sm">Crea tu primera promoción para atraer suscriptores</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {promos.map((p: any) => {
            const isActive = p.is_active && new Date(p.start_date) <= now && new Date(p.end_date) >= now
            const isExpired = new Date(p.end_date) < now
            const isFull = p.max_uses !== null && p.current_uses >= p.max_uses
            return (
              <div key={p.id} className={`bg-slate-800/50 border rounded-2xl p-5 transition-all ${isActive ? 'border-pink-500/30' : 'border-slate-700'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{p.name}</h3>
                      {isActive && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase">Activa</span>}
                      {isExpired && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full uppercase">Expirada</span>}
                      {isFull && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full uppercase">Agotada</span>}
                    </div>
                    {p.description && <p className="text-sm text-slate-400 mb-3">{p.description}</p>}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        {p.discount_type === 'percentage' ? <Percent className="w-3.5 h-3.5 text-pink-400" /> : <DollarSign className="w-3.5 h-3.5 text-pink-400" />}
                        {p.discount_type === 'percentage' ? `${p.discount_value}% de descuento` : `Precio fijo: ${fmt(p.discount_value)}`}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        {new Date(p.start_date).toLocaleDateString('es-AR')} → {new Date(p.end_date).toLocaleDateString('es-AR')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-amber-400" />
                        {p.current_uses}/{p.max_uses ?? '∞'} usos
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-violet-400" />
                        Duración: {p.promo_duration_months} mes{p.promo_duration_months > 1 ? 'es' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setModal({ open: true, promo: p })}
                      className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm(`¿Eliminar "${p.name}"?`)) deleteMut.mutate(p.id) }}
                      className="p-2 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal.open && <PromoModal promo={modal.promo} plans={plans} onClose={() => setModal({ open: false, promo: null })} />}
    </div>
  )
}

function PromoModal({ promo, plans, onClose }: { promo: any; plans: any[]; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: promo?.name || '',
    description: promo?.description || '',
    discount_type: promo?.discount_type || 'percentage',
    discount_value: promo?.discount_value?.toString() || '20',
    start_date: promo?.start_date ? new Date(promo.start_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    end_date: promo?.end_date ? new Date(promo.end_date).toISOString().slice(0, 16) : '',
    max_uses: promo?.max_uses?.toString() || '',
    promo_duration_months: promo?.promo_duration_months?.toString() || '1',
    applies_to_plan_ids: promo?.applies_to_plan_ids || [],
    is_active: promo?.is_active ?? true,
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        discount_value: Number(form.discount_value),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        promo_duration_months: Number(form.promo_duration_months),
        applies_to_plan_ids: form.applies_to_plan_ids.length > 0 ? form.applies_to_plan_ids : null,
      }
      if (promo?.id) return (await apiClient.patch(`/billing/promotions/${promo.id}`, payload)).data
      return (await apiClient.post('/billing/promotions', payload)).data
    },
    onSuccess: () => {
      toast.success(promo ? 'Promoción actualizada' : 'Promoción creada')
      qc.invalidateQueries({ queryKey: ['promotions'] })
      onClose()
    },
    onError: () => toast.error('Error al guardar'),
  })

  const togglePlan = (planId: string) => {
    setForm((f) => {
      const ids = f.applies_to_plan_ids.includes(planId)
        ? f.applies_to_plan_ids.filter((id: string) => id !== planId)
        : [...f.applies_to_plan_ids, planId]
      return { ...f, applies_to_plan_ids: ids }
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">{promo ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate() }} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Nombre *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white mt-1" placeholder="Ej: Black Friday 2026" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Descripción</label>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Tipo de Descuento</label>
              <select value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white mt-1">
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed_price">Precio Fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">{form.discount_type === 'percentage' ? 'Descuento (%)' : 'Precio ($)'}</label>
              <input type="number" step="0.01" value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} required
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Inicio *</label>
              <input type="datetime-local" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} required
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Fin *</label>
              <input type="datetime-local" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} required
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Máx. Usos <span className="text-slate-500">(vacío = ilimitado)</span></label>
              <input type="number" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white mt-1" placeholder="∞" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Duración Promo (meses)</label>
              <input type="number" min="1" value={form.promo_duration_months} onChange={(e) => setForm((f) => ({ ...f, promo_duration_months: e.target.value }))} required
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Aplica a planes <span className="text-slate-500">(ninguno = todos)</span></label>
            <div className="flex flex-wrap gap-2">
              {plans.map((plan: any) => (
                <button key={plan.id} type="button" onClick={() => togglePlan(plan.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    form.applies_to_plan_ids.includes(plan.id)
                      ? 'bg-pink-600/20 border-pink-500 text-pink-300'
                      : 'bg-slate-900 border-slate-600 text-slate-400 hover:text-white'
                  }`}>
                  {plan.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase">Activa</label>
            <button type="button" onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}>
              {form.is_active ? <ToggleRight className="w-8 h-8 text-emerald-400" /> : <ToggleLeft className="w-8 h-8 text-slate-500" />}
            </button>
          </div>
          <button type="submit" disabled={saveMut.isPending}
            className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
            {promo ? 'Guardar Cambios' : 'Crear Promoción'}
          </button>
        </form>
      </div>
    </div>
  )
}
