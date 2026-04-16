import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@api/client'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, X, Calendar, Users, GitBranch, Zap } from 'lucide-react'

export default function SubscriptionsPage() {
  const queryClient = useQueryClient()
  const [changePlanModal, setChangePlanModal] = useState<{ open: boolean; sub: any }>({ open: false, sub: null })
  const [selectedPlanId, setSelectedPlanId] = useState('')

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['billing-subscriptions'],
    queryFn: async () => (await apiClient.get('/billing/subscriptions')).data,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => (await apiClient.get('/billing/plans')).data,
  })

  const changePlan = useMutation({
    mutationFn: async ({ tenant_id, new_plan_id }: { tenant_id: string; new_plan_id: string }) =>
      (await apiClient.post('/billing/subscriptions/change-plan', { tenant_id, new_plan_id })).data,
    onSuccess: () => {
      toast.success('Plan actualizado')
      queryClient.invalidateQueries({ queryKey: ['billing-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['billing-mrr'] })
      setChangePlanModal({ open: false, sub: null })
    },
    onError: () => toast.error('Error al cambiar el plan'),
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await apiClient.patch(`/tenants/${id}/status`, { status })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscriptions'] })
      toast.success('Estado actualizado')
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Suscripciones</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestión de planes por negocio — cambiar plan, activar o suspender</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: subscriptions.length, color: 'text-blue-500' },
          { label: 'Activas', value: subscriptions.filter((s: any) => !s.is_expired).length, color: 'text-emerald-500' },
          { label: 'Vencidas', value: subscriptions.filter((s: any) => s.is_expired).length, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Negocio</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Plan actual</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Vencimiento</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Días</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{sub.tenant?.business_name ?? sub.tenant_id}</p>
                    <p className="text-xs text-muted-foreground">{sub.tenant?.owner_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {sub.plan ? (
                      <div>
                        <p className="font-medium text-foreground">{sub.plan.name}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                          <span><Users className="w-3 h-3 inline mr-0.5" />{sub.plan.max_users}</span>
                          <span><GitBranch className="w-3 h-3 inline mr-0.5" />{sub.plan.max_branches}</span>
                        </div>
                      </div>
                    ) : <span className="text-muted-foreground text-xs">Sin plan</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      sub.tenant?.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                      sub.tenant?.status === 'trial' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{sub.tenant?.status ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    {new Date(sub.end_date).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      sub.is_expired ? 'bg-red-500/20 text-red-400' :
                      sub.days_left <= 7 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {sub.is_expired ? `Vencido ${Math.abs(sub.days_left)}d` : `${sub.days_left}d`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => { setChangePlanModal({ open: true, sub }); setSelectedPlanId(sub.plan_id ?? '') }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors">
                        <Zap className="w-3.5 h-3.5" /> Plan
                      </button>
                      {sub.tenant?.status !== 'active' && (
                        <button onClick={() => updateStatus.mutate({ id: sub.tenant_id, status: 'active' })}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {sub.tenant?.status !== 'suspended' && (
                        <button onClick={() => updateStatus.mutate({ id: sub.tenant_id, status: 'suspended' })}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {changePlanModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">Cambiar plan</h2>
                <p className="text-sm text-muted-foreground">{changePlanModal.sub?.tenant?.business_name}</p>
              </div>
              <button onClick={() => setChangePlanModal({ open: false, sub: null })} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {plans.map((plan: any) => (
                <label key={plan.id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPlanId === plan.id ? 'border-violet-500 bg-violet-500/10' : 'border-border hover:border-muted-foreground/30'
                }`}>
                  <input type="radio" name="plan" value={plan.id} checked={selectedPlanId === plan.id}
                    onChange={() => setSelectedPlanId(plan.id)} className="mt-0.5 accent-violet-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{plan.name}</span>
                      <span className="text-sm font-bold text-foreground">
                        {Number(plan.price_monthly) === 0 ? 'Gratis' :
                          new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(plan.price_monthly)
                        }/mes
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span><Users className="w-3 h-3 inline mr-0.5" />{plan.max_users === 99 ? 'Ilimitados' : plan.max_users} usuarios</span>
                      <span><GitBranch className="w-3 h-3 inline mr-0.5" />{plan.max_branches} sucursal{plan.max_branches > 1 ? 'es' : ''}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setChangePlanModal({ open: false, sub: null })}
                className="flex-1 px-4 py-2 border border-border rounded-xl text-sm text-foreground hover:bg-muted/30">
                Cancelar
              </button>
              <button onClick={() => changePlan.mutate({ tenant_id: changePlanModal.sub.tenant_id, new_plan_id: selectedPlanId })}
                disabled={!selectedPlanId || changePlan.isPending}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                {changePlan.isPending ? 'Aplicando...' : 'Cambiar plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

