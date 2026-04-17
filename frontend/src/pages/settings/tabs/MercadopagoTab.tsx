import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { 
  Loader2, CreditCard, ShieldCheck, Wifi, AlertTriangle, 
  ChevronDown, ChevronUp, Link2, ExternalLink, CheckCircle2
} from 'lucide-react'
import {
  useMercadopagoConfig,
  useSaveMercadopagoConfig,
  useMercadopagoAuthUrl,
} from '@hooks/useSettings'
import type { SaveMercadopagoCredentialsDto } from '@api/settings.types'
import toast from 'react-hot-toast'

export default function MercadopagoTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: config, isLoading, refetch } = useMercadopagoConfig()
  const saveMutation = useSaveMercadopagoConfig()
  const getAuthUrlMutation = useMercadopagoAuthUrl()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const { register, handleSubmit, reset } = useForm<SaveMercadopagoCredentialsDto>({
    defaultValues: {
      public_key: '',
      access_token: '',
      store_id: '',
      pos_id: '',
      is_sandbox: true,
    },
  })

  // Manejar mensajes de éxito/error del URL (vienen del callback del backend)
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      toast.success('¡MercadoPago vinculado con éxito!', { duration: 5000 })
      refetch()
      // Limpiar params para no repetir el toast
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('success')
      setSearchParams(newParams)
    }

    if (error) {
      toast.error(`Error al vincular: ${error}`, { duration: 6000 })
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('error')
      setSearchParams(newParams)
    }
  }, [searchParams, refetch, setSearchParams])

  useEffect(() => {
    if (!config) return
    reset({
      public_key: config.public_key ?? '',
      access_token: config.access_token ?? '',
      store_id: config.store_id ?? '',
      pos_id: config.pos_id ?? '',
      is_sandbox: config.is_sandbox ?? true,
    })
  }, [config, reset])

  const onSubmit = (data: SaveMercadopagoCredentialsDto) => {
    saveMutation.mutate(data)
  }

  const handleStartOAuth = async () => {
    try {
      const { url } = await getAuthUrlMutation.mutateAsync()
      window.location.href = url; // Redirigir a MercadoPago
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'No se pudo generar la URL de vinculación.'
      toast.error(msg, { duration: 6000 })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-sky-500" />
            Integración con MercadoPago
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Aceptá pagos electrónicos en tu local. Los clientes escanean tu QR y vos recibís la confirmación al instante.
          </p>
        </div>
        {config?.is_configured ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20 text-sm font-bold animate-pulse-subtle">
            <CheckCircle2 className="w-4 h-4" />
            VINCULADO
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20 text-sm font-bold">
            <AlertTriangle className="w-4 h-4" />
            SIN CONFIGURAR
          </div>
        )}
      </div>

      {/* Main Connection Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Vinculación Automática (Recomendado)
            </h3>
            
            <p className="text-sm text-muted-foreground mb-6">
              El método más fácil y seguro. No necesitás conocimientos técnicos ni buscar claves. Solo autorizás y listo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={getAuthUrlMutation.isPending}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-sky-500/20 group transform active:scale-95 disabled:opacity-50"
              >
                {getAuthUrlMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                )}
                {config?.is_configured ? 'Re-vincular Cuenta' : 'Vincular mi Cuenta Ahora'}
              </button>
              
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Seguridad Garantizada por MercadoPago
                </div>
              </div>
            </div>
          </div>

          {/* Connection Status Info */}
          {config?.is_configured && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex gap-4 items-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">¡Tu cuenta está lista!</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Ya podés seleccionar MercadoPago como método de cobro en el POS.</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="space-y-4">
          <div className="bg-muted/30 border border-border rounded-2xl p-5">
            <h4 className="font-bold text-sm mb-3">¿Qué permite esta vinculación?</h4>
            <ul className="space-y-3">
              {[
                'Generar QRs dinámicos desde el POS',
                'Cobros con Link de Pago',
                'Registro automático al impactar el pago',
                'Informes de ventas MP integrados'
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 mt-0.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Advanced Section */}
      <div className="pt-4 border-t border-border">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Configuración Avanzada (Tokens Manuales)
        </button>

        {showAdvanced && (
          <div className="mt-6 p-6 bg-muted/20 border border-border rounded-3xl space-y-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Wifi className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-200">
                <p className="font-bold uppercase tracking-wider text-[10px]">Uso exclusivo para desarrolladores</p>
                <p className="mt-1">Si vinculaste tu cuenta automáticamente arriba, no necesitás completar estos campos.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Public Key</label>
                  <input {...register('public_key')} className="input-field" placeholder="APP_USR-..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Access Token</label>
                  <input {...register('access_token')} className="input-field" placeholder="APP_USR-..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Store ID</label>
                  <input {...register('store_id')} className="input-field" placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">POS ID</label>
                  <input {...register('pos_id')} className="input-field" placeholder="Opcional" />
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl cursor-pointer hover:bg-accent/50 transition-colors">
                <input type="checkbox" {...register('is_sandbox')} className="w-4 h-4 text-primary rounded" />
                <span className="text-sm font-medium text-foreground">Operar en Modo Sandbox (Pruebas)</span>
              </label>

              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Guardar Manualmente
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExternalLink className="w-10 h-10 text-sky-500" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Autorizar MercadoPago</h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Se abrirá el portal oficial de <strong>MercadoPago</strong>. Deberás iniciar sesión y autorizar a nuestra App de Kioskos para gestionar los cobros.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-6 py-3 rounded-xl border border-border font-bold hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleStartOAuth();
                  }}
                  className="px-6 py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/20"
                >
                  Continuar
                </button>
              </div>
            </div>
            <div className="bg-muted/50 p-4 text-center border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Flujo Seguro Certificado</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
