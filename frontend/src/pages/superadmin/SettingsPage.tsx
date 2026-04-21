import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import systemSettingsApi, { SystemSetting } from '@api/system-settings.api'
import { 
  Settings, Save, Loader2, Info, Gift, Clock, ShieldCheck, 
  Percent, Calendar, Layers, BookOpen, Building2, BarChart3,
  Download, BellRing
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function SuperAdminSettingsPage() {
  const queryClient = useQueryClient()
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({})

  const { data: settings = [], isLoading } = useQuery<SystemSetting[]>({
    queryKey: ['system-settings'],
    queryFn: systemSettingsApi.getSettings
  })

  // Sincronizar settings iniciales con estado local (Reemplaza onSuccess de v4)
  useEffect(() => {
    if (settings && settings.length > 0) {
      const dict = settings.reduce((acc: Record<string, string>, s: SystemSetting) => ({ ...acc, [s.key]: s.value }), {})
      setLocalSettings(dict)
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string, value: string }) => 
      systemSettingsApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      toast.success('Ajuste actualizado correctamente')
    },
    onError: () => toast.error('Error al actualizar el ajuste')
  })

  const handleToggle = (key: string, current: string) => {
    const newValue = current === 'true' ? 'false' : 'true'
    setLocalSettings(prev => ({ ...prev, [key]: newValue }))
    updateMutation.mutate({ key, value: newValue })
  }

  const handleSave = (key: string) => {
    updateMutation.mutate({ key, value: localSettings[key] })
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
      <p className="text-slate-400 font-medium">Cargando configuración global...</p>
    </div>
  )

  const getS = (key: string) => {
    if (!Array.isArray(settings)) return localSettings[key] || '';
    return localSettings[key] || settings.find((s: SystemSetting) => s.key === key)?.value || '';
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-violet-600" />
          Ajustes Globales del Sistema
        </h1>
        <p className="text-slate-500 font-medium max-w-2xl">
          Configurá los parámetros base de la plataforma, el período de prueba y los beneficios del programa de referidos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ─── Período de Prueba ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Días de Prueba (Trial)</h3>
              <p className="text-sm text-slate-500 font-medium">Define cuántos días gratis recibe cada nuevo negocio.</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 text-left">
            <div className="flex flex-col gap-2 shrink-0">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">DÍAS</label>
              <input 
                type="number"
                value={getS('trial_days')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings(p => ({ ...p, trial_days: e.target.value }))}
                className="w-24 h-12 px-4 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-bold text-lg rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => handleSave('trial_days')} 
              className="mt-6 flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Save className="w-4 h-4" /> Guardar Cambios
            </button>
            <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/50">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                Este valor se aplica al momento del registro. Si cambias este valor, los negocios ya registrados mantendrán su fecha de expiración actual.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Programa de Referidos ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 space-y-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Programa de Referidos</h3>
                <p className="text-sm text-slate-500 font-medium">Incentiva el crecimiento viral de la plataforma.</p>
              </div>
            </div>
            {/* Toggle switch simple con HTML/Tailwind */}
            <button 
              onClick={() => handleToggle('referral_benefit_enabled', getS('referral_benefit_enabled'))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${getS('referral_benefit_enabled') === 'true' ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${getS('referral_benefit_enabled') === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className={`space-y-6 transition-opacity ${getS('referral_benefit_enabled') === 'true' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">DESCUENTO (%)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={getS('referral_discount_percentage')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings(p => ({ ...p, referral_discount_percentage: e.target.value }))}
                    className="w-full h-12 px-10 bg-slate-50 dark:bg-slate-800 border-none font-bold text-lg rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">DURACIÓN (MESES)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={getS('referral_benefit_months')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings(p => ({ ...p, referral_benefit_months: e.target.value }))}
                    className="w-full h-12 px-10 bg-slate-50 dark:bg-slate-800 border-none font-bold text-lg rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
            <button 
              onClick={() => { handleSave('referral_discount_percentage'); handleSave('referral_benefit_months'); }} 
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> ACTUALIZAR REGLAS DE REFERIDOS
            </button>
          </div>
        </div>

        {/* ─── Módulos y Funcionalidades ─── */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Módulos Globales</h3>
              <p className="text-sm text-slate-500 font-medium">Habilitá o deshabilitá funcionalidades para toda la plataforma.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {[
              { key: 'feature_afip', label: 'Facturación Electrónica AFIP', desc: 'Conexión con WSFEv1', icon: ShieldCheck },
              { key: 'feature_accounting', label: 'Contabilidad Automática', desc: 'Generación de Libro Diario', icon: BookOpen },
              { key: 'feature_multi_branch', label: 'Multi-sucursal', desc: 'Gestión de múltiples sedes', icon: Building2 },
              { key: 'feature_reports_history', label: 'Historial de Reportes', desc: 'BI y Analytics avanzado', icon: BarChart3 },
              { key: 'feature_export', label: 'Exportación PDF/Excel', desc: 'Descarga de datos y tablas', icon: Download },
              { key: 'feature_email_alerts', label: 'Alertas por Email', desc: 'Vencimientos y stock bajo', icon: BellRing },
            ].map((f) => (
              <div key={f.key} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                    <f.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{f.label}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{f.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggle(f.key, getS(f.key))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${getS(f.key) === 'true' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${getS(f.key) === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Seguridad y Mantenimiento ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Seguridad y Mantenimiento</h3>
              <p className="text-sm text-slate-500 font-medium">Control de acceso y estado global.</p>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 text-left">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Nuevos Registros</p>
                <p className="text-xs text-slate-500">Permitir que nuevos negocios se registren.</p>
              </div>
              <button 
                onClick={() => handleToggle('allow_registrations', getS('allow_registrations'))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${getS('allow_registrations') === 'true' ? 'bg-emerald-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${getS('allow_registrations') === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Modo Mantenimiento</p>
                <p className="text-xs text-slate-500 text-red-500">Bloquea el acceso general.</p>
              </div>
              <button 
                onClick={() => handleToggle('maintenance_mode', getS('maintenance_mode'))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${getS('maintenance_mode') === 'true' ? 'bg-red-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${getS('maintenance_mode') === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
