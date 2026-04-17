import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { 
  Settings, GitBranch, Users, Building2, FileText, CreditCard,
  LayoutGrid, List, ChevronRight, ArrowLeft 
} from 'lucide-react'

// Tabs / Sub-páginas
import BranchesTab from './tabs/BranchesTab'
import UsersTab from './tabs/UsersTab'
import BusinessTab from './tabs/BusinessTab'
import AfipTab from './tabs/AfipTab'
import MercadopagoTab from './tabs/MercadopagoTab'

const settingsTools = [
  { 
    id: 'branches',
    to: '/settings/branches', 
    label: 'Sucursales', 
    description: 'Gestiona múltiples puntos de venta y depósitos',
    icon: GitBranch, 
    color: 'bg-indigo-500' 
  },
  { 
    id: 'users',
    to: '/settings/users', 
    label: 'Usuarios y Permisos', 
    description: 'Control de accesos, roles y personal',
    icon: Users, 
    color: 'bg-orange-500' 
  },
  { 
    id: 'business',
    to: '/settings/business', 
    label: 'Datos del Negocio', 
    description: 'Información fiscal, logo y configuración general',
    icon: Building2, 
    color: 'bg-blue-600' 
  },
  { 
    id: 'afip',
    to: '/settings/afip', 
    label: 'Facturación ARCA', 
    description: 'Certificados, puntos de venta y modo fiscal',
    icon: FileText, 
    color: 'bg-slate-700' 
  },
  { 
    id: 'mercadopago',
    to: '/settings/mercadopago', 
    label: 'MercadoPago', 
    description: 'Pagos QR, cobros online y conciliación',
    icon: CreditCard, 
    color: 'bg-sky-500' 
  },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const isHub = location.pathname === '/settings' || location.pathname === '/settings/'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Dinámico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {!isHub && (
              <button 
                onClick={() => navigate('/settings')}
                className="p-2 hover:bg-accent rounded-xl transition-colors group"
                title="Volver al menú de configuración"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            )}
            <div className="flex items-center gap-3">
              {isHub && (
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-indigo-600" />
                </div>
              )}
              <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-1 ml-1">
            {isHub ? 'Personaliza y gestiona los parámetros de tu plataforma' : settingsTools.find(t => location.pathname.startsWith(t.to))?.label}
          </p>
        </div>

        {isHub && (
          <div className="flex bg-muted p-1 rounded-xl self-end sm:self-auto">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Contenido Principal */}
      <div className="animate-fade-in">
        {isHub ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "flex flex-col gap-3"
          }>
            {settingsTools.map((tool) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  onClick={() => navigate(tool.to)}
                  className={`group relative text-left transition-all duration-300 ${
                    viewMode === 'grid'
                      ? "p-6 bg-card border border-border rounded-3xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 min-h-[160px] flex flex-col justify-between"
                      : "p-4 bg-card border border-border rounded-xl hover:bg-accent flex items-center justify-between"
                  }`}
                >
                  <div className={`flex items-center gap-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${tool.color} transition-transform group-hover:scale-110`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{tool.label}</h3>
                      <p className={`text-sm text-muted-foreground line-clamp-1 ${viewMode === 'grid' ? 'mt-1' : 'hidden sm:block'}`}>
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  
                  {viewMode === 'grid' ? (
                    <div className="flex justify-end pt-4">
                      <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-primary group-hover:border-primary transition-all">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm min-h-[400px]">
            <Routes>
              <Route path="branches" element={<BranchesTab />} />
              <Route path="users" element={<UsersTab />} />
              <Route path="business" element={<BusinessTab />} />
              <Route path="afip" element={<AfipTab />} />
              <Route path="mercadopago" element={<MercadopagoTab />} />
            </Routes>
          </div>
        )}
      </div>
    </div>
  )
}
