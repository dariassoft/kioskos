import { useState } from 'react'
import { Settings, GitBranch, Users, Building2, FileText, CreditCard } from 'lucide-react'
import BranchesTab from './tabs/BranchesTab'
import UsersTab from './tabs/UsersTab'
import BusinessTab from './tabs/BusinessTab'
import AfipTab from './tabs/AfipTab'
import MercadopagoTab from './tabs/MercadopagoTab'

type Tab = 'branches' | 'users' | 'business' | 'afip' | 'mercadopago'

const tabs: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: 'branches', label: 'Sucursales', icon: GitBranch },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'business', label: 'Mi Negocio', icon: Building2 },
  { id: 'afip', label: 'Facturación ARCA', icon: FileText },
  { id: 'mercadopago', label: 'MercadoPago', icon: CreditCard },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('branches')

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-600/20 flex items-center justify-center">
          <Settings className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná sucursales, usuarios y datos de tu negocio
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido del tab activo */}
      <div className="animate-fade-in">
        {activeTab === 'branches' && <BranchesTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'business' && <BusinessTab />}
        {activeTab === 'afip' && <AfipTab />}
        {activeTab === 'mercadopago' && <MercadopagoTab />}
      </div>
    </div>
  )
}
