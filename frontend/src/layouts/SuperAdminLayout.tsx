import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/auth.store'
import { LayoutDashboard, Users, CreditCard, LogOut, ShieldCheck } from 'lucide-react'

const superAdminNav = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/superadmin/tenants', icon: Users, label: 'Negocios' },
  { to: '/superadmin/billing', icon: CreditCard, label: 'Facturación' },
]

export default function SuperAdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
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
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto p-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
