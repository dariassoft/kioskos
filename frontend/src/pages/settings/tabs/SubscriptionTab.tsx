import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@api/client'
import toast from 'react-hot-toast'
import { AlertTriangle, Loader2, CreditCard, XCircle, CheckCircle } from 'lucide-react'

export default function SubscriptionTab() {
  const qc = useQueryClient()
  const [cancelModal, setCancelModal] = useState(false)
  const [reason, setReason] = useState('')

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => (await apiClient.get('/billing/my-subscription')).data,
  })

  const { data: history = [] } = useQuery({
    queryKey: ['my-billing-history'],
    queryFn: async () => (await apiClient.get('/billing/my-billing-history')).data,
  })

  const cancelMut = useMutation({
    mutationFn: async () => (await apiClient.post('/billing/my-subscription/cancel', { reason })).data,
    onSuccess: (data: any) => {
      toast.success(data.message || 'Suscripción cancelada')
      qc.invalidateQueries({ queryKey: ['my-subscription'] })
      setCancelModal(false)
    },
    onError: () => toast.error('Error al cancelar la suscripción'),
  })

  const fmt = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v)

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  if (!subscription) {
    return (
      <div className="text-center py-10">
        <XCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="font-bold text-foreground">Sin suscripción activa</p>
        <p className="text-sm text-muted-foreground mt-1">Contacta al soporte para más información</p>
      </div>
    )
  }

  const isCancelled = subscription.status === 'cancelled'
  const endDate = new Date(subscription.end_date)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Mi Suscripción</h2>

      {/* Plan Info */}
      <div className="bg-muted/50 rounded-2xl p-5 border border-border">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan Actual</p>
            <p className="text-2xl font-black text-foreground mt-1">{subscription.locked_plan_name || 'N/A'}</p>
            <p className="text-lg font-bold text-primary mt-0.5">{fmt(Number(subscription.locked_price || 0))}/mes</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isCancelled ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {isCancelled ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
              {isCancelled ? 'Cancelada' : 'Activa'}
            </span>
            <p className="text-xs text-muted-foreground mt-2">
              Próximo vencimiento: <span className="font-bold">{endDate.toLocaleDateString('es-AR')}</span>
            </p>
            {subscription.promo_ends_at && (
              <p className="text-xs text-pink-500 font-bold mt-1">
                🎁 Promoción activa hasta {new Date(subscription.promo_ends_at).toLocaleDateString('es-AR')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Billing History */}
      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase mb-3">Historial de Pagos</h3>
          <div className="space-y-2">
            {history.slice(0, 6).map((h: any) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border text-sm">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{fmt(Number(h.amount))}</p>
                    <p className="text-xs text-muted-foreground">{h.plan_name || 'Plan'} • {h.payment_method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold ${h.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {h.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                  <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString('es-AR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {!isCancelled && (
        <div className="pt-6 border-t border-border">
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-red-600">Darme de Baja</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Al cancelar tu suscripción, conservás el acceso hasta el fin del período pago ({endDate.toLocaleDateString('es-AR')}).
                  Después de eso, tu cuenta será congelada y no podrás acceder a tus datos.
                  Si te suscribís nuevamente, se creará una cuenta nueva.
                </p>
                <button onClick={() => setCancelModal(true)}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors">
                  Cancelar Suscripción
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCancelModal(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">¿Estás seguro?</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Esta acción cancelará tu suscripción. Perderás acceso a todos tus datos una vez que expire el período pago actual.
              </p>
              <div className="mt-4">
                <label className="text-xs font-bold text-muted-foreground uppercase block text-left mb-1">Motivo (opcional)</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm resize-none"
                  placeholder="¿Por qué te das de baja?" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setCancelModal(false)}
                  className="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-accent transition-colors">
                  Volver
                </button>
                <button onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {cancelMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirmar Baja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
