import { useQuery } from '@tanstack/react-query'
import apiClient from '@api/client'
import { Users, Store, TrendingUp, AlertCircle, ShieldCheck } from 'lucide-react'

export default function SuperAdminDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['tenant-metrics'],
    queryFn: async () => {
      const res = await apiClient.get('/tenants/metrics')
      return res.data
    },
  })

  const stats = [
    { label: 'Total negocios', value: metrics?.total ?? '—', icon: Store, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Activos', value: metrics?.active ?? '—', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'En prueba', value: metrics?.trial ?? '—', icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Suspendidos', value: metrics?.suspended ?? '—', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel SuperAdmin</h1>
          <p className="text-muted-foreground text-sm">Gestión global de la plataforma Kioskos & Despenzas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-2">Próximas funcionalidades SuperAdmin</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• MRR (Monthly Recurring Revenue) en tiempo real</li>
          <li>• Activar/desactivar módulos por tenant</li>
          <li>• Historial de pagos y facturas</li>
          <li>• Alertas de suscripciones por vencer</li>
        </ul>
      </div>
    </div>
  )
}
