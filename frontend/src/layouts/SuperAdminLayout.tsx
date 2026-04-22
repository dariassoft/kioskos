import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@store/auth.store'
import { LayoutDashboard, Users, CreditCard, LogOut, ShieldCheck, RefreshCw, Layers, Clock3, Bell, BellOff, PlayCircle, Settings, Gift, CalendarCheck } from 'lucide-react'
import checkoutApi from '@api/checkout.api'
import { SuperAdminPendingRealtimeBridge, SUPERADMIN_PENDING_SOUND_STORAGE_KEY, playSoftNotificationSound } from '@hooks/useSuperAdminPendingRealtime'

const superAdminNav = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/superadmin/tenants', icon: Users, label: 'Negocios' },
  { to: '/superadmin/subscriptions', icon: RefreshCw, label: 'Suscripciones' },
  { to: '/superadmin/billing', icon: CreditCard, label: 'Facturación' },
  { to: '/superadmin/upcoming-charges', icon: CalendarCheck, label: 'Cobros Próximos' },
  { to: '/superadmin/pending-payments', icon: Clock3, label: 'Pagos pendientes' },
  { to: '/superadmin/promotions', icon: Gift, label: 'Promociones' },
  { to: '/superadmin/plans', icon: Layers, label: 'Planes' },
  { to: '/superadmin/settings', icon: Settings, label: 'Ajustes Globales' },
]

export default function SuperAdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = window.localStorage.getItem(SUPERADMIN_PENDING_SOUND_STORAGE_KEY)
    return stored === null ? true : stored !== '0'
  })
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['checkout', 'manual-pending'],
    queryFn: async () => (await checkoutApi.getManualPendingList()).length,
    staleTime: 1000 * 30,
  })

  useEffect(() => {
    window.localStorage.setItem(SUPERADMIN_PENDING_SOUND_STORAGE_KEY, soundEnabled ? '1' : '0')
  }, [soundEnabled])

  const handleToggleSound = () => {
    setSoundEnabled((value) => {
      const nextValue = !value
      if (nextValue) {
        playSoftNotificationSound()
      }
      return nextValue
    })
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SuperAdminPendingRealtimeBridge />
      {/* Sidebar SuperAdmin — color diferenciado (slate oscuro) */}
      <aside className="w-60 flex flex-col bg-slate-900 border-r border-slate-700">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">SuperAdmin</p>
              <p className="text-xs text-slate-400">Kioskos & Despenzas</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {superAdminNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/superadmin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
              {to === '/superadmin/pending-payments' && pendingCount > 0 && (
                <span className="ml-auto min-w-6 h-6 px-2 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[11px] font-bold animate-pulse shadow-[0_0_0_0_rgba(245,158,11,0.45)]">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400">Super Administrador</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/auth/login') }}
              className="p-1 rounded hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="pb-10 space-y-3">
            <button
              type="button"
              onClick={handleToggleSound}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? <Bell className="w-3.5 h-3.5 text-emerald-400" /> : <BellOff className="w-3.5 h-3.5 text-slate-400" />}
              Alertas {soundEnabled ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={playSoftNotificationSound}
              disabled={!soundEnabled}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Probar Audio
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto p-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
