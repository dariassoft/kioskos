import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/auth.store'
import { useBranchStore } from '@store/branch.store'
import { useBranches } from '@hooks/useSettings'
import { usePWA } from '@hooks/usePWA'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Truck,
  BookOpen, ChevronLeft, ChevronRight,
  LogOut, Store, Bell, Menu, UserCircle, Moon, Sun, Settings, FileText, Download
} from 'lucide-react'
import NotificationDropdown from '@components/NotificationDropdown'
import { useNotificationsRealtime } from '@hooks/useNotificationsRealtime'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tablero & Reportes' },
  { to: '/pos', icon: ShoppingCart, label: 'POS / Venta' },
  { to: '/inventory', icon: Package, label: 'Inventario' },
  { to: '/customers', icon: Users, label: 'Clientes / Fiados' },
  { to: '/purchases', icon: Truck, label: 'Compras' },
  { to: '/accounting', icon: BookOpen, label: 'Contabilidad' },
  { to: '/afip/invoices', icon: FileText, label: 'Facturas ARCA' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const { user, logout } = useAuthStore()
  const { activeBranch } = useBranchStore()
  const navigate = useNavigate()
  const { isInstallable, isInstalled, installApp } = usePWA()

  // Carga las sucursales y auto-selecciona la principal si no hay ninguna activa
  useBranches()
  
  // Escuchar notificaciones en tiempo real
  useNotificationsRealtime()

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const toggleTheme = () => {
    const root = document.documentElement
    if (isDark) {
      root.classList.remove('dark')
      setIsDark(false)
    } else {
      root.classList.add('dark')
      setIsDark(true)
    }
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Kioskos & Despenzas</p>
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                {activeBranch?.name || 'Sin sucursal'}
              </p>
            </div>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto">
            <Store className="w-4 h-4 text-white" />
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed && !isMobile ? 'justify-center px-2' : ''}`
            }
            title={collapsed && !isMobile ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || isMobile) && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Perfil de usuario */}
      <div className="p-2 border-t border-border">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${(collapsed && !isMobile) ? 'justify-center' : ''}`}>
          <UserCircle className="w-8 h-8 text-muted-foreground flex-shrink-0" />
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          )}
          {(!collapsed || isMobile) && (
            <button
              onClick={handleLogout}
              className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        {collapsed && !isMobile && (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-2 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors mt-1"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* ==========================================
          SIDEBAR DESKTOP
         ========================================== */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
          }`}
      >
        <SidebarContent />
      </aside>

      {/* ==========================================
          DRAWER MOBILE
         ========================================== */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-[101] w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent isMobile />
      </aside>

      {/* ==========================================
          ÁREA PRINCIPAL
         ========================================== */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <Store className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-sm truncate max-w-[120px]">
                {activeBranch?.name || 'Kioskos'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Botón de Instalación PWA (Ocultar texto en móvil extremo) */}
            {isInstallable && !isInstalled && (
              <button
                onClick={installApp}
                className="flex items-center gap-2 px-2 py-1.5 md:px-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all text-[10px] md:text-xs font-bold border border-primary/20 animate-pulse"
                title="Instalar APP"
              >
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden xs:inline">INSTALAR</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <NotificationDropdown />
          </div>
        </header>

        {/* Contenido de las páginas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 animate-fade-in">
          <Outlet />
        </main>

        {/* ==========================================
            BOTTOM NAVIGATION MOBILE
           ========================================== */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          {[
            { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
            { to: '/pos', icon: ShoppingCart, label: 'Venta' },
            { to: '/inventory', icon: Package, label: 'Stock' },
            { to: '/settings', icon: Settings, label: 'Ajustes' },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-muted-foreground'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
