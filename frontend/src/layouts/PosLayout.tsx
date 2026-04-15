import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/auth.store'
import { useBranchStore } from '@store/branch.store'
import { LogOut, LayoutGrid, Store } from 'lucide-react'

interface PosLayoutProps {
  children: ReactNode
}

/**
 * PosLayout — Pantalla completa para el terminal de ventas.
 * Sin sidebar. Optimizado para teclado y pantallas táctiles.
 */
export default function PosLayout({ children }: PosLayoutProps) {
  const { user, logout } = useAuthStore()
  const { activeBranch } = useBranchStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header mínimo del POS */}
      <header className="h-12 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <Store className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white text-sm font-semibold">
            Kioskos & Despenzas
            {activeBranch && (
              <span className="text-slate-400 font-normal ml-2">
                — {activeBranch.name}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs">
            {user?.name} · <span className="capitalize">{user?.role}</span>
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Ir al panel"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Contenido del POS — ocupa toda la pantalla restante */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
