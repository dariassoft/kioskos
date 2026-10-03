import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import systemSettingsApi, { SystemSetting } from '@api/system-settings.api'
import { 
  Settings, Save, Loader2, Info, Gift, Clock, ShieldCheck,
  Percent, Calendar, Layers, Plus, Trash2, CreditCard
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { FEATURE_LABELS, PLAN_FEATURES } from '@api/checkout.api'

export default function SuperAdminSettingsPage() {
  const queryClient = useQueryClient()
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({})
  const [mpPublicKey, setMpPublicKey] = useState('')
  const [mpAccessToken, setMpAccessToken] = useState('')
  const [mpEnabled, setMpEnabled] = useState(false)
  const [transferAccounts, setTransferAccounts] = useState<Array<{ id?: string; name: string; alias: string; cbu: string; holder: string; bank: string; active: boolean }>>([])

  const { data: settings = [], isLoading } = useQuery<SystemSetting[]>({
    queryKey: ['system-settings'],
    queryFn: systemSettingsApi.getSettings
  })

  const { data: platformPayments } = useQuery({
    queryKey: ['platform-payments'],
    queryFn: systemSettingsApi.getPlatformPayments,
  })

  // Sincronizar settings iniciales con estado local (Reemplaza onSuccess de v4)
  useEffect(() => {
    if (settings && settings.length > 0) {
      const dict = settings.reduce((acc: Record<string, string>, s: SystemSetting) => ({ ...acc, [s.key]: s.value }), {})
      setLocalSettings(dict)
    }
  }, [settings])

  useEffect(() => {
    if (!platformPayments) return
    setMpEnabled(platformPayments.mercadopago.enabled)
    setMpPublicKey(platformPayments.mercadopago.public_key)
    setTransferAccounts(platformPayments.transfer_accounts.map((account) => ({
      id: account.id,
      name: account.name,
      alias: account.alias ?? '',
      cbu: account.cbu ?? '',
      holder: account.holder ?? '',
      bank: account.bank ?? '',
      active: account.active !== false,
    })))
  }, [platformPayments])

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string, value: string }) => 
      systemSettingsApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      queryClient.invalidateQueries({ queryKey: ['system-public-info'] })
      toast.success('Ajuste actualizado correctamente')
    },
    onError: () => toast.error('Error al actualizar el ajuste')
  })

  const platformPaymentMutation = useMutation({
    mutationFn: () => systemSettingsApi.updatePlatformPayments({
      mercadopago_enabled: mpEnabled,
      mercadopago_public_key: mpPublicKey,
      mercadopago_access_token: mpAccessToken || undefined,
      transfer_accounts: transferAccounts,
    }),
    onSuccess: () => {
      setMpAccessToken('')
      queryClient.invalidateQueries({ queryKey: ['platform-payments'] })
      toast.success('Configuración de cobros guardada')
    },
    onError: () => toast.error('No se pudo guardar la configuración de cobros'),
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
            {PLAN_FEATURES.map((key) => {
              const settingKey = `feature_${key}`
              const label = FEATURE_LABELS[key]
              return (
              <div key={settingKey} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                    <Layers className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Llave global de disponibilidad</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggle(settingKey, getS(settingKey))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${getS(settingKey) === 'true' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${getS(settingKey) === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              )
            })}
          </div>
        </div>

        {/* ─── Cobros de suscripciones ─── */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cobros de suscripciones</h3>
              <p className="text-sm text-slate-500 font-medium">Configurá Mercado Pago y las cuentas donde recibirás transferencias.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">Access token de Mercado Pago</label>
              <input type="password" value={mpAccessToken} onChange={(event) => setMpAccessToken(event.target.value)} placeholder={platformPayments?.mercadopago.configured ? 'Token configurado (dejar vacío para conservarlo)' : 'APP_USR-...'} className="input w-full" />
              <p className="text-[11px] text-slate-500">Se guarda y nunca se muestra completo en pantalla.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">Public key (opcional)</label>
              <input value={mpPublicKey} onChange={(event) => setMpPublicKey(event.target.value)} placeholder="APP_USR-..." className="input w-full" />
              <button type="button" onClick={() => setMpEnabled((value) => !value)} className={`inline-flex items-center gap-2 text-sm font-semibold ${mpEnabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                <span className={`w-9 h-5 rounded-full relative ${mpEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}><span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full ${mpEnabled ? 'left-4' : 'left-0.5'}`} /></span>
                Mercado Pago habilitado para checkout
              </button>
            </div>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Cuentas para transferencia</h4>
                <p className="text-xs text-slate-500">El cliente podrá elegir cualquiera de las cuentas activas.</p>
              </div>
              <button type="button" onClick={() => setTransferAccounts((accounts) => [...accounts, { name: '', alias: '', cbu: '', holder: '', bank: '', active: true }])} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold"><Plus className="w-3.5 h-3.5" /> Agregar cuenta</button>
            </div>
            {transferAccounts.map((account, index) => (
              <div key={account.id ?? index} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <input value={account.name} onChange={(event) => setTransferAccounts((items) => items.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} placeholder="Nombre" className="input sm:col-span-1" />
                <input value={account.alias} onChange={(event) => setTransferAccounts((items) => items.map((item, i) => i === index ? { ...item, alias: event.target.value } : item))} placeholder="Alias" className="input sm:col-span-1" />
                <input value={account.cbu} onChange={(event) => setTransferAccounts((items) => items.map((item, i) => i === index ? { ...item, cbu: event.target.value } : item))} placeholder="CBU" className="input sm:col-span-2" />
                <input value={account.holder} onChange={(event) => setTransferAccounts((items) => items.map((item, i) => i === index ? { ...item, holder: event.target.value } : item))} placeholder="Titular" className="input sm:col-span-1" />
                <button type="button" onClick={() => setTransferAccounts((items) => items.filter((_, i) => i !== index))} className="h-10 inline-flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => platformPaymentMutation.mutate()} disabled={platformPaymentMutation.isPending} className="h-11 px-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2">
            {platformPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar configuración de cobros
          </button>
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
