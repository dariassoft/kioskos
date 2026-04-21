import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, Save, Loader2, AlertCircle, CheckCircle2,
  CreditCard, GitBranch, Users, type LucideIcon, Settings,
} from 'lucide-react'
import { settingsBusinessApi } from '@/api/settings.api'
import type { UpdateBusinessProfileDto } from '@/api/settings.types'
import { FEATURE_LABELS } from '@/api/checkout.api'
const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Activo', cls: 'bg-emerald-500/10 text-emerald-600' },
  trial: { label: 'Período de prueba', cls: 'bg-blue-500/10 text-blue-600' },
  suspended: { label: 'Suspendido', cls: 'bg-destructive/10 text-destructive' },
  past_due: { label: 'Pago vencido', cls: 'bg-amber-500/10 text-amber-600' },
}
export default function BusinessTab() {
  const qc = useQueryClient()
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [form, setForm] = useState<UpdateBusinessProfileDto & { settings?: any }>({})
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: settingsBusinessApi.get,
  })
  if (profile && !initialized) {
    setForm({
      business_name: profile.business_name,
      tax_id: profile.tax_id ?? '',
      phone: profile.phone ?? '',
      address: profile.address ?? '',
      settings: profile.settings ?? { generate_accounting_on_adjustment: false },
    })
    setInitialized(true)
  }
  const updateMutation = useMutation({
    mutationFn: settingsBusinessApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'business'] })
      setSuccess(true)
      setFormError(null)
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Error al guardar los datos.')
    },
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(form)
  }
  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando datos del negocio...
    </div>
  )
  if (isError || !profile) return (
    <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
      <AlertCircle className="w-5 h-5" /> Error al cargar el perfil del negocio.
    </div>
  )
  const statusInfo = STATUS_LABELS[profile.status] ?? STATUS_LABELS.trial
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* FORMULARIO */}
      <div className="xl:col-span-2 space-y-6">
        <div className="card p-6 border border-border rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Datos del negocio</h2>
          </div>
          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-emerald-500/10 text-emerald-600 rounded-lg text-sm">
              <CheckCircle2 className="w-4 h-4" /> Datos guardados correctamente.
            </div>
          )}
          {formError && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" /> {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre del negocio</label>
                <input
                  value={form.business_name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                  className="input w-full"
                  placeholder="Kiosko Don Pedro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">CUIT / Tax ID</label>
                <input
                  value={form.tax_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tax_id: e.target.value }))}
                  className="input w-full"
                  placeholder="20-12345678-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Teléfono</label>
                <input
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="input w-full"
                  placeholder="+54 11 9876-5432"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email del propietario</label>
                <input value={profile.owner_email} disabled className="input w-full opacity-60 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Dirección</label>
              <input
                value={form.address ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="input w-full"
                placeholder="Av. Rivadavia 500, CABA"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {updateMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />
                }
                Guardar cambios
              </button>
            </div>
          </form>
        </div>

        {/* PREFERENCIAS */}
        <div className="card p-6 border border-border rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Preferencias y Automatización</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex-1 pr-4">
                <p className="text-sm font-bold text-foreground">Asientos contables automáticos</p>
                <p className="text-xs text-muted-foreground">Generar un asiento de pérdida automáticamente cuando se registre un ajuste de stock (robo, vencimiento, rotura).</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ 
                  ...f, 
                  settings: { ...f.settings, generate_accounting_on_adjustment: !f.settings?.generate_accounting_on_adjustment } 
                }))}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${form.settings?.generate_accounting_on_adjustment ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute w-4 h-4 rounded-full bg-white transition-all ${form.settings?.generate_accounting_on_adjustment ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* PANEL LATERAL */}
      <div className="space-y-4">
        <div className="card p-5 border border-border rounded-xl space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Estado de la cuenta</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.cls}`}>
            {statusInfo.label}
          </span>
          <p className="text-xs text-muted-foreground">
            Miembro desde{' '}
            {new Date(profile.created_at).toLocaleDateString('es-AR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <div className="card p-5 border border-border rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Plan actual</h3>
          </div>
          {profile.current_plan ? (
            <>
              <div className="text-2xl font-bold text-foreground">{profile.current_plan.name}</div>
              <p className="text-sm text-muted-foreground">{profile.current_plan.description}</p>
              <div className="text-lg font-semibold text-indigo-600">
                ${Number(profile.current_plan.price_monthly).toLocaleString('es-AR')}/mes
              </div>
              {profile.current_plan.features && (
                <ul className="space-y-1 text-xs text-muted-foreground pt-1">
                  {Object.entries(profile.current_plan.features)
                    .reduce((acc, [key, val]) => {
                      const label = FEATURE_LABELS[key] || key.replace(/_/g, ' ')
                      if (!acc.some(item => item.label === label)) {
                        acc.push({ key, label, val })
                      }
                      return acc
                    }, [] as any[])
                    .map(({ key, label, val }) => (
                    <li key={key} className={`flex items-center gap-1.5 ${val ? 'text-foreground' : 'line-through opacity-50'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sin plan activo</p>
          )}
        </div>
        <div className="card p-5 border border-border rounded-xl space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Uso del plan</h3>
          <div className="space-y-3">
            <UsageBar
              icon={GitBranch}
              label="Sucursales"
              current={profile.branch_count}
              max={profile.current_plan?.max_branches ?? 1}
            />
            <UsageBar
              icon={Users}
              label="Usuarios activos"
              current={profile.user_count}
              max={profile.current_plan?.max_users ?? 1}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
function UsageBar({
  icon: Icon,
  label,
  current,
  max,
}: {
  icon: LucideIcon
  label: string
  current: number
  max: number
}) {
  const pct = Math.min((current / Math.max(max, 1)) * 100, 100)
  const isNearLimit = pct >= 80
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="w-3.5 h-3.5" /> {label}
        </span>
        <span className={`font-medium ${isNearLimit ? 'text-amber-600' : 'text-foreground'}`}>
          {current} / {max >= 9999 ? '\u221e' : max}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
