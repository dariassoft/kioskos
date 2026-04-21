import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@api/client'
import toast from 'react-hot-toast'
import { Plus, X, Edit2, ToggleLeft, ToggleRight, Users, GitBranch, Check } from 'lucide-react'
import { FEATURE_LABELS } from '@/api/checkout.api'

const FEATURES_LIST = [
  { key: 'pos_terminal', label: FEATURE_LABELS.pos_terminal },
  { key: 'inventory', label: FEATURE_LABELS.inventory },
  { key: 'barcode_scanner', label: FEATURE_LABELS.barcode_scanner },
  { key: 'customers_credit', label: FEATURE_LABELS.customers_credit },
  { key: 'automated_accounting', label: FEATURE_LABELS.automated_accounting },
  { key: 'multi_branch', label: FEATURE_LABELS.multi_branch },
  { key: 'reports_bi', label: FEATURE_LABELS.reports_bi },
  { key: 'export_pdf_excel', label: FEATURE_LABELS.export_pdf_excel },
  { key: 'email_notifications', label: FEATURE_LABELS.email_notifications },
  { key: 'electronic_invoicing', label: FEATURE_LABELS.electronic_invoicing },
]

const emptyForm = {
  name: '',
  description: '',
  price_monthly: '',
  max_branches: '1',
  max_users: '1',
  features: {} as Record<string, boolean>,
}

export default function PlansPage() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; plan: any | null }>({ open: false, plan: null })
  const [form, setForm] = useState(emptyForm)

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => (await apiClient.get('/billing/plans')).data,
  })

  const savePlan = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        name: data.name,
        description: data.description,
        price_monthly: Number(data.price_monthly),
        max_branches: Number(data.max_branches),
        max_users: Number(data.max_users),
        features: data.features,
      }
      if (modal.plan?.id) {
        return (await apiClient.patch(`/billing/plans/${modal.plan.id}`, payload)).data
      }
      return (await apiClient.post('/billing/plans', payload)).data
    },
    onSuccess: () => {
      toast.success(modal.plan ? 'Plan actualizado' : 'Plan creado')
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] })
      setModal({ open: false, plan: null })
    },
    onError: () => toast.error('Error al guardar el plan'),
  })

  const togglePlan = useMutation({
    mutationFn: async (id: string) => (await apiClient.patch(`/billing/plans/${id}/toggle`)).data,
    onSuccess: () => {
      toast.success('Estado del plan actualizado')
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] })
    },
  })

  const openCreate = () => {
    setForm(emptyForm)
    setModal({ open: true, plan: null })
  }

  const openEdit = (plan: any) => {
    setForm({
      name: plan.name,
      description: plan.description ?? '',
      price_monthly: String(plan.price_monthly),
      max_branches: String(plan.max_branches),
      max_users: String(plan.max_users),
      features: plan.features ?? {},
    })
    setModal({ open: true, plan })
  }

  const toggleFeature = (key: string) => {
    setForm((f) => ({ ...f, features: { ...f.features, [key]: !f.features[key] } }))
  }

  const formatPrice = (v: number) =>
    Number(v) === 0 ? 'Gratis' :
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v) + '/mes'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planes de suscripción</h1>
          <p className="text-muted-foreground text-sm mt-1">Configurá los planes disponibles para los negocios</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo plan
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map((plan: any) => (
            <div key={plan.id} className={`bg-card border rounded-xl p-5 flex flex-col gap-4 transition-all ${
              plan.is_active ? 'border-border' : 'border-border/40 opacity-60'
            }`}>
              {/* Header del plan */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
                    {!plan.is_active && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactivo</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-violet-500 mt-1">{formatPrice(plan.price_monthly)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(plan)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => togglePlan.mutate(plan.id)}
                    className={`p-1.5 rounded-lg ${plan.is_active ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-muted-foreground hover:bg-muted/50'}`}>
                    {plan.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Descripción */}
              {plan.description && (
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              )}

              {/* Límites */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{plan.max_users === 99 ? 'Ilimitados' : plan.max_users} usuarios</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>{plan.max_branches} sucursal{plan.max_branches > 1 ? 'es' : ''}</span>
                </div>
              </div>

              {/* Features */}
              <div className="border-t border-border pt-3 space-y-1.5">
                {FEATURES_LIST.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      plan.features?.[key] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
                    }`}>
                      {plan.features?.[key] ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    </div>
                    <span className={plan.features?.[key] ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar plan */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {modal.plan ? 'Editar plan' : 'Nuevo plan'}
              </h2>
              <button onClick={() => setModal({ open: false, plan: null })} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Profesional"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Descripción</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Para cadenas y comercios grandes"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Precio/mes (ARS)</label>
                  <input type="number" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: e.target.value })}
                    placeholder="4999"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Usuarios</label>
                  <input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })}
                    placeholder="3"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Sucursales</label>
                  <input type="number" value={form.max_branches} onChange={(e) => setForm({ ...form, max_branches: e.target.value })}
                    placeholder="1"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Módulos incluidos</label>
                <div className="space-y-2">
                  {FEATURES_LIST.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <div onClick={() => toggleFeature(key)}
                        className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${form.features[key] ? 'bg-violet-600' : 'bg-muted'}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${form.features[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm text-foreground">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setModal({ open: false, plan: null })}
                className="flex-1 px-4 py-2 border border-border rounded-xl text-sm text-foreground hover:bg-muted/30">
                Cancelar
              </button>
              <button onClick={() => savePlan.mutate(form)}
                disabled={!form.name || !form.price_monthly || savePlan.isPending}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                {savePlan.isPending ? 'Guardando...' : (modal.plan ? 'Guardar cambios' : 'Crear plan')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

