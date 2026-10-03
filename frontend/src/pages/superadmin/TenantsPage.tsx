import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@api/client'
import toast from 'react-hot-toast'
import { Store, CheckCircle, XCircle, Plus, X } from 'lucide-react'

type TenantStatus = 'active' | 'suspended' | 'trial' | 'past_due'

const statusConfig: Record<TenantStatus, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'badge-active' },
  trial: { label: 'Prueba', className: 'badge-trial' },
  suspended: { label: 'Suspendido', className: 'badge-suspended' },
  past_due: { label: 'Vencido', className: 'badge-past-due' },
}

export default function TenantsPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    business_name: '',
    owner_name: '',
    owner_email: '',
    owner_password: '',
    tax_id: '',
    phone: '',
    address: '',
    plan_id: '',
    activation_mode: 'trial' as 'trial' | 'paid',
    billing_period_months: '1',
    payment_method: 'cash' as 'cash' | 'transfer' | 'bank' | 'mercadopago',
  })

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await apiClient.get('/tenants')
      return res.data
    },
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['billing-plans-for-tenant-provisioning'],
    queryFn: async () => (await apiClient.get('/billing/plans')).data,
  })

  const createTenant = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        tax_id: form.tax_id || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        activation_mode: form.activation_mode,
        billing_period_months: Number(form.billing_period_months),
        payment_method: form.payment_method,
      }
      return (await apiClient.post('/tenants', payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-metrics'] })
      setShowCreate(false)
      setForm({
        business_name: '', owner_name: '', owner_email: '', owner_password: '',
         tax_id: '', phone: '', address: '', plan_id: '',
         activation_mode: 'trial', billing_period_months: '1', payment_method: 'cash',
      })
       toast.success(form.activation_mode === 'paid' ? 'Negocio creado y período cobrado registrado' : 'Negocio creado con período de prueba configurado')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message
      toast.error(Array.isArray(message) ? message.join(', ') : message || 'No se pudo crear el negocio')
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TenantStatus }) => {
      const res = await apiClient.patch(`/tenants/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-metrics'] })
      toast.success('Estado actualizado correctamente')
    },
    onError: () => toast.error('Error al actualizar el estado'),
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Negocios</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestión de todos los tenants de la plataforma
            </p>
          </div>
             <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 self-start">
             <Plus className="w-4 h-4" /> Nuevo negocio
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6">
            <Store className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Sin negocios registrados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los negocios aparecerán aquí cuando se registren en la plataforma.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Negocio</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Registro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.map((tenant: any) => {
                const cfg = statusConfig[tenant.status as TenantStatus] ?? statusConfig.trial
                return (
                  <tr key={tenant.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                          <Store className="w-4 h-4 text-indigo-500" />
                        </div>
                        <span className="font-medium text-foreground">{tenant.business_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tenant.owner_email}</td>
                    <td className="px-4 py-3">
                      <span className={cfg.className}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        {tenant.status !== 'active' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: tenant.id, status: 'active' })}
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                            title="Activar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {tenant.status !== 'suspended' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: tenant.id, status: 'suspended' })}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-500/10 transition-colors"
                            title="Suspender"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                 <h2 className="text-lg font-semibold text-foreground">Crear negocio</h2>
                 <p className="text-xs text-muted-foreground mt-1">Se crea el negocio, su administrador y Casa Central. Podés asignar prueba o registrar un período ya cobrado.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-muted" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6"
              onSubmit={(event) => {
                event.preventDefault()
                createTenant.mutate()
              }}
            >
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Nombre del negocio *</span>
                <input required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="input w-full" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Plan *</span>
                <select required value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })} className="input w-full">
                  <option value="">Seleccionar plan</option>
                  {plans.filter((plan: any) => plan.is_active).map((plan: any) => (
                    <option key={plan.id} value={plan.id}>{plan.name} — ${Number(plan.price_monthly).toLocaleString('es-AR')}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Modalidad *</span>
                <select required value={form.activation_mode} onChange={(e) => setForm({ ...form, activation_mode: e.target.value as 'trial' | 'paid' })} className="input w-full">
                  <option value="trial">Prueba gratuita (días configurados en Settings)</option>
                  <option value="paid">Período pagado manualmente</option>
                </select>
              </label>
              {form.activation_mode === 'paid' && <>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Período cobrado</span>
                  <select value={form.billing_period_months} onChange={(e) => setForm({ ...form, billing_period_months: e.target.value })} className="input w-full">
                    <option value="1">1 mes</option>
                    <option value="3">3 meses</option>
                    <option value="6">6 meses</option>
                    <option value="12">1 año</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Medio de pago</span>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value as typeof form.payment_method })} className="input w-full">
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="bank">Banco</option>
                    <option value="mercadopago">MercadoPago</option>
                  </select>
                </label>
              </>}
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Nombre del administrador *</span>
                <input required value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className="input w-full" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Email del administrador *</span>
                <input required type="email" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} className="input w-full" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Contraseña inicial *</span>
                <input required minLength={8} type="password" value={form.owner_password} onChange={(e) => setForm({ ...form, owner_password: e.target.value })} className="input w-full" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">CUIT/CUIL</span>
                <input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} className="input w-full" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Teléfono</span>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input w-full" />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="text-muted-foreground">Dirección</span>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input w-full" />
              </label>
              <div className="flex justify-end gap-3 sm:col-span-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={createTenant.isPending} className="btn-primary disabled:opacity-50">
                  {createTenant.isPending ? 'Creando...' : 'Crear negocio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
