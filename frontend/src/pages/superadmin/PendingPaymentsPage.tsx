import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@api/client'
import checkoutApi, { type PendingSubscriptionItem } from '@api/checkout.api'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Clock3,
  Loader2,
  Mail,
  Phone,
  User,
} from 'lucide-react'

const statusConfig: Record<string, { label: string; className: string }> = {
  manual_pending: { label: 'Pendiente manual', className: 'bg-amber-500/20 text-amber-400' },
  manual_approved: { label: 'Aprobado manual', className: 'bg-emerald-500/20 text-emerald-400' },
  pending: { label: 'Pendiente', className: 'bg-sky-500/20 text-sky-400' },
  approved: { label: 'Aprobado', className: 'bg-emerald-500/20 text-emerald-400' },
  rejected: { label: 'Rechazado', className: 'bg-red-500/20 text-red-400' },
  expired: { label: 'Vencido', className: 'bg-slate-500/20 text-slate-300' },
}

const methodConfig: Record<string, { label: string; icon: typeof Banknote }> = {
  transfer: { label: 'Transferencia', icon: Banknote },
  mercadopago: { label: 'MercadoPago', icon: CreditCard },
}

export default function PendingPaymentsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['checkout', 'manual-pending'],
    queryFn: checkoutApi.getManualPendingList,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/billing/plans')
        return Array.isArray(response.data) ? response.data : []
      } catch (err) {
        console.error('Error fetching plans:', err)
        return []
      }
    },
  })

  const approveMutation = useMutation({
    mutationFn: checkoutApi.adminApprovePending,
    onSuccess: () => {
      toast.success('Cuenta activada correctamente')
      queryClient.invalidateQueries({ queryKey: ['checkout', 'manual-pending'] })
      queryClient.invalidateQueries({ queryKey: ['billing-history'] })
      queryClient.invalidateQueries({ queryKey: ['billing-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['billing-mrr'] })
      queryClient.invalidateQueries({ queryKey: ['billing-expiring'] })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: () => toast.error('No se pudo aprobar el pago pendiente'),
  })

  const planMap = useMemo(() => {
    const map = new Map<string, string>()
    if (Array.isArray(plans)) {
      plans.forEach((plan) => {
        if (plan && plan.id) map.set(plan.id, plan.name)
      })
    }
    return map
  }, [plans])

  const filteredPending = useMemo(() => {
    if (!Array.isArray(pending)) return []
    const term = search.trim().toLowerCase()
    if (!term) return pending

    return pending.filter((item: PendingSubscriptionItem) => {
      const haystack = [
        item.business_name,
        item.owner_name,
        item.owner_email,
        item.transfer_alias ?? '',
        item.transfer_notes ?? '',
        item.tax_id ?? '',
        item.plan_id,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(term)
    })
  }, [pending, search])

  const totalAmount = useMemo(() => {
    const list = Array.isArray(filteredPending) ? filteredPending : []
    return list.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }, [filteredPending])

  const transferCount = useMemo(() => {
    const list = Array.isArray(filteredPending) ? filteredPending : []
    return list.filter((item) => item.payment_method === 'transfer').length
  }, [filteredPending])

  const mpCount = useMemo(() => {
    const list = Array.isArray(filteredPending) ? filteredPending : []
    return list.filter((item) => item.payment_method === 'mercadopago').length
  }, [filteredPending])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(value)

  const handleApprove = (item: PendingSubscriptionItem) => {
    const confirmed = window.confirm(
      `¿Aprobar el pago pendiente de ${item.business_name}? Esto activará la cuenta del negocio.`,
    )
    if (!confirmed) return
    approveMutation.mutate(item.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Clock3 className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pagos pendientes</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Verificá transferencias manuales y activá cuentas cuando el pago haya sido confirmado.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-80">
          <label className="block text-xs text-muted-foreground mb-1">Buscar</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Negocio, email, alias, comprobante..."
            className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Pendientes visibles</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredPending.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Monto total</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Canales</p>
          <p className="text-sm font-medium text-foreground mt-1">
            {transferCount} transferencias · {mpCount} MercadoPago
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : filteredPending.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-center p-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <p className="font-medium text-foreground">No hay pagos pendientes</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Cuando llegue una transferencia manual o un pago que requiera verificación, aparecerá aquí para que puedas aprobarlo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Negocio</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Contacto</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Método</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Monto</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Detalle</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPending.map((item) => {
                  const planName = planMap.get(item.plan_id) ?? item.plan_id
                  const method = methodConfig[item.payment_method] ?? methodConfig.transfer
                  const MethodIcon = method.icon
                  const status = statusConfig[item.status] ?? statusConfig.manual_pending

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors align-top">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{item.business_name}</p>
                            {item.tax_id && (
                              <p className="text-xs text-muted-foreground mt-0.5">CUIT/CUIL: {item.tax_id}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>{item.owner_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{item.owner_email}</span>
                          </div>
                          {item.owner_phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{item.owner_phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-foreground font-medium">{planName}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MethodIcon className="w-3.5 h-3.5" />
                          <span>{method.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-foreground">
                        {formatCurrency(Number(item.amount))}
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground max-w-[260px]">
                        {item.payment_method === 'transfer' ? (
                          <div className="space-y-1">
                            <p>
                              <span className="font-medium text-foreground">Alias/CBU:</span>{' '}
                              {item.transfer_alias ?? '—'}
                            </p>
                            <p className="line-clamp-3">{item.transfer_notes ?? 'Sin referencia informada'}</p>
                            {item.transfer_voucher && (
                              <a href={item.transfer_voucher} target="_blank" rel="noreferrer" className="inline-flex text-amber-600 hover:underline font-medium">
                                Ver comprobante adjunto
                              </a>
                            )}
                          </div>
                        ) : (
                          <p>{item.mp_init_point ?? 'Pago vía MercadoPago pendiente de confirmación'}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleApprove(item)}
                          disabled={approveMutation.isPending}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Aprobar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p>
          Al aprobar un pago se activa la cuenta del negocio, se crea su tenant y se registra la suscripción correspondiente.
        </p>
      </div>
    </div>
  )
}



