import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import systemSettingsApi, { SystemSetting } from '@api/system-settings.api'
import { 
  Settings, Save, Loader2, Info, Gift, Clock, ShieldCheck, 
  Percent, Calendar
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

  const getS = (key: string) => localSettings[key] || settings.find((s: SystemSetting) => s.key === key)?.value || ''

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
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CANTIDAD DE DÍAS</label>
                <div className="flex gap-2 mt-1">
                  <input 
                    type="number"
                    value={getS('trial_days')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings(p => ({ ...p, trial_days: e.target.value }))}
                    className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-800 border-none font-bold text-lg rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button 
                    onClick={() => handleSave('trial_days')} 
                    className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-bold flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" /> Guardar
                  </button>
                </div>
              </div>
            </div>
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

        {/* ─── Seguridad y Auth ─── */}
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
                <p className="text-xs text-slate-500">Permitir que nuevos negocios se registren en la plataforma.</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-600 opacity-50 cursor-not-allowed">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Modo Mantenimiento</p>
                <p className="text-xs text-slate-500 text-red-500">Bloquea el acceso a todos los usuarios (Excepto SuperAdmin).</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300 opacity-50 cursor-not-allowed">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
