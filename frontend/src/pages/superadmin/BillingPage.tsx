import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@api/client'
import toast from 'react-hot-toast'
import { type LucideIcon } from 'lucide-react'
import { DollarSign, Plus, X, Receipt, CreditCard, Banknote, Smartphone } from 'lucide-react'

type PaymentMethod = 'cash' | 'transfer' | 'mercadopago'

const methodConfig: Record<PaymentMethod, { label: string; icon: LucideIcon; color: string }> = {
  cash: { label: 'Efectivo', icon: Banknote, color: 'text-emerald-500' },
  transfer: { label: 'Transferencia', icon: CreditCard, color: 'text-blue-500' },
  mercadopago: { label: 'MercadoPago', icon: Smartphone, color: 'text-sky-500' },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: 'Pagado', className: 'bg-emerald-500/20 text-emerald-400' },
  pending: { label: 'Pendiente', className: 'bg-amber-500/20 text-amber-400' },
  failed: { label: 'Fallido', className: 'bg-red-500/20 text-red-400' },
}

export default function BillingPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [filterTenant, setFilterTenant] = useState('')
  const [form, setForm] = useState({
    tenant_id: '',
    amount: '',
    payment_method: 'cash' as PaymentMethod,
    months: '1',
    notes: '',
  })

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['billing-history', filterTenant],
    queryFn: async () => {
      const url = filterTenant
        ? `/billing/history?tenant_id=${filterTenant}`
        : '/billing/history'
      return (await apiClient.get(url)).data
    },
  })

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => (await apiClient.get('/tenants')).data,
  })

  const registerPayment = useMutation({
    mutationFn: async (data: typeof form) => {
      return (await apiClient.post('/billing/payments', {
        tenant_id: data.tenant_id,
        amount: Number(data.amount),
        payment_method: data.payment_method,
        months: Number(data.months),
        notes: data.notes || undefined,
      })).data
    },
    onSuccess: () => {
      toast.success('✅ Pago registrado y suscripción extendida')
      queryClient.invalidateQueries({ queryKey: ['billing-history'] })
      queryClient.invalidateQueries({ queryKey: ['billing-mrr'] })
      queryClient.invalidateQueries({ queryKey: ['billing-expiring'] })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setShowModal(false)
      setForm({ tenant_id: '', amount: '', payment_method: 'cash', months: '1', notes: '' })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Error al registrar el pago'),
  })

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v)

  const totalIngresos = history
    .filter((h: any) => h.payment_status === 'paid')
    .reduce((sum: number, h: any) => sum + Number(h.amount), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facturación y Pagos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Historial de cobros y registro de pagos manuales
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar pago
        </button>
      </div>

      {/* Stats de la lista actual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalIngresos)}</p>
            <p className="text-xs text-muted-foreground">Total cobrado (filtro actual)</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{history.length}</p>
            <p className="text-xs text-muted-foreground">Transacciones</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <label className="block text-xs text-muted-foreground mb-1">Filtrar por negocio</label>
          <select
            value={filterTenant}
            onChange={(e) => setFilterTenant(e.target.value)}
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-1.5 text-foreground"
          >
            <option value="">Todos los negocios</option>
            {tenants.map((t: any) => (
              <option key={t.id} value={t.id}>{t.business_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla historial */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6">
            <Receipt className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Sin registros de pago</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los pagos aparecerán aquí cuando se registren.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Negocio</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Método</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Monto</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Fecha</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((h: any) => {
                const method = methodConfig[h.payment_method as PaymentMethod]
                const status = statusConfig[h.payment_status] ?? statusConfig.pending
                const MethodIcon = method?.icon ?? DollarSign
                return (
                  <tr key={h.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {h.tenant_name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <MethodIcon className={`w-3.5 h-3.5 ${method?.color ?? 'text-muted-foreground'}`} />
                        <span className="text-muted-foreground">{method?.label ?? h.payment_method}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      {formatCurrency(Number(h.amount))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[140px] truncate">
                      {h.invoice_url ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal registrar pago */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Registrar pago manual</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Negocio */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Negocio *</label>
                <select
                  value={form.tenant_id}
                  onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Seleccionar negocio...</option>
                  {tenants
                    .filter((t: any) => t.id !== '00000000-0000-0000-0000-000000000001') // excluir tenant sistema
                    .map((t: any) => (
                      <option key={t.id} value={t.id}>{t.business_name}</option>
                    ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Monto (ARS) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="4999"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Método de pago *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(methodConfig) as [PaymentMethod, any][]).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, payment_method: key })}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                          form.payment_method === key
                            ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                            : 'border-border text-muted-foreground hover:border-border/80'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${form.payment_method === key ? 'text-violet-400' : cfg.color}`} />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Meses */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Meses que abona
                </label>
                <select
                  value={form.months}
                  onChange={(e) => setForm({ ...form, months: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  {[1, 2, 3, 6, 12].map((m) => (
                    <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>
                  ))}
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Notas / comprobante</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Nro de transferencia, comentario..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-xl text-sm text-foreground hover:bg-muted/30"
              >
                Cancelar
              </button>
              <button
                onClick={() => registerPayment.mutate(form)}
                disabled={!form.tenant_id || !form.amount || registerPayment.isPending}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {registerPayment.isPending ? 'Registrando...' : 'Registrar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


