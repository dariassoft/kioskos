import { useQuery } from '@tanstack/react-query'
import apiClient from '@api/client'
import {
  Store, TrendingUp, AlertCircle, ShieldCheck,
  DollarSign, Clock, ArrowUpRight, Clock3,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

export default function SuperAdminDashboard() {
  const { data: tenantMetrics } = useQuery({
    queryKey: ['tenant-metrics'],
    queryFn: async () => (await apiClient.get('/tenants/metrics')).data,
  })

  const { data: mrrData } = useQuery({
    queryKey: ['billing-mrr'],
    queryFn: async () => (await apiClient.get('/billing/metrics/mrr')).data,
  })

  const { data: expiring = [] } = useQuery({
    queryKey: ['billing-expiring'],
    queryFn: async () => (await apiClient.get('/billing/metrics/expiring?days=7')).data,
  })

  const { data: pendingPaymentsCount = 0 } = useQuery({
    queryKey: ['checkout', 'manual-pending'],
    queryFn: async () => (await apiClient.get('/checkout/admin/manual-pending')).data.length,
    staleTime: 1000 * 30,
  })

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v)

  const stats = [
    {
      label: 'MRR Actual',
      value: mrrData ? formatCurrency(mrrData.mrr) : '—',
      icon: DollarSign,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      sub: 'Ingresos recurrentes mensuales',
    },
    {
      label: 'Total negocios',
      value: mrrData?.total_tenants ?? '—',
      icon: Store,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      sub: `${mrrData?.total_active ?? 0} con suscripción activa`,
    },
    {
      label: 'Activos',
      value: tenantMetrics?.active ?? '—',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      sub: `${tenantMetrics?.trial ?? 0} en período de prueba`,
    },
    {
      label: 'Vencen pronto',
      value: mrrData?.expiring_soon ?? '—',
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      sub: 'En los próximos 7 días',
    },
  ]

  const chartData = (mrrData?.monthly_revenue ?? []).map((r: any) => ({
    month: r.month,
    ingresos: r.revenue,
  }))

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel SuperAdmin</h1>
          <p className="text-muted-foreground text-sm">Gestión global de la plataforma Kioskos & Despenzas</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
            <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm font-medium text-foreground/80">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
            </div>
          </div>
        ))}

        <a
          href="/superadmin/pending-payments"
          className={`bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all ${pendingPaymentsCount > 0 ? 'ring-1 ring-amber-500/20' : ''}`}
        >
          <div className={`w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 ${pendingPaymentsCount > 0 ? 'animate-pulse' : ''}`}>
            <Clock3 className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-2xl font-bold text-foreground transition-all ${pendingPaymentsCount > 0 ? 'animate-pulse' : ''}`}>
              {pendingPaymentsCount > 99 ? '99+' : pendingPaymentsCount}
            </p>
            <p className="text-sm font-medium text-foreground/80">Pagos pendientes</p>
            <p className="text-xs text-muted-foreground mt-0.5">Transferencias y cobros manuales a verificar</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground mt-1" />
        </a>
      </div>

      {/* Gráfico de ingresos */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Ingresos mensuales</h3>
          <span className="text-xs text-muted-foreground">Últimos 6 meses</span>
        </div>
        {chartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
            Sin datos de ingresos aún
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="mrr-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'Ingresos']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              />
              <Area type="monotone" dataKey="ingresos" stroke="#7c3aed" fill="url(#mrr-grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Alertas de vencimiento */}
      {expiring.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-foreground text-sm">
              {expiring.length} suscripción{expiring.length > 1 ? 'es' : ''} próxima{expiring.length > 1 ? 's' : ''} a vencer
            </h3>
          </div>
          <div className="space-y-2">
            {expiring.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">{s.tenant?.business_name ?? s.tenant_id}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{s.plan?.name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    s.days_left <= 2 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {s.days_left}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Ver todos los negocios', href: '/superadmin/tenants', icon: Store },
          { label: 'Registrar pago', href: '/superadmin/billing', icon: DollarSign },
          { label: 'Pagos pendientes', href: '/superadmin/pending-payments', icon: Clock3 },
        ].map(({ label, href, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group"
          >
            <Icon className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-foreground">{label}</span>
            <ArrowUpRight className="w-3 h-3 text-muted-foreground ml-auto group-hover:text-violet-500 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  )
}
