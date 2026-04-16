import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, CreditCard, ShieldCheck, Wifi, AlertTriangle } from 'lucide-react'
import {
  useMercadopagoConfig,
  useSaveMercadopagoConfig,
} from '@hooks/useSettings'
import type { SaveMercadopagoCredentialsDto } from '@api/settings.types'

export default function MercadopagoTab() {
  const { data: config, isLoading } = useMercadopagoConfig()
  const saveMutation = useSaveMercadopagoConfig()

  const { register, handleSubmit, reset } = useForm<SaveMercadopagoCredentialsDto>({
    defaultValues: {
      public_key: '',
      access_token: '',
      store_id: '',
      pos_id: '',
      is_sandbox: true,
    },
  })

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">MercadoPago</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configurá la cuenta que recibirá pagos por QR, link y tarjeta.
          </p>
        </div>
        {config?.is_configured ? (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-lg text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            Configurado
          </span>
        ) : (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-lg text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Pendiente
          </span>
        )}
      </div>

      {config?.is_sandbox && (
        <div className="flex gap-3 p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg">
          <Wifi className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-sky-900 dark:text-sky-200">
            <p className="font-medium">Modo Sandbox</p>
            <p className="mt-1">Ideal para pruebas. Antes de operar en producción desactivá esta opción.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Public Key</label>
          <input {...register('public_key', { required: true })} className="input-field" placeholder="APP_USR-..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Access Token</label>
          <input {...register('access_token', { required: true })} className="input-field" placeholder="APP_USR-..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Store ID</label>
            <input {...register('store_id')} className="input-field" placeholder="STORE_123" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">POS ID</label>
            <input {...register('pos_id')} className="input-field" placeholder="POS_123" />
          </div>
        </div>

        <label className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
          <input type="checkbox" {...register('is_sandbox')} />
          <span className="text-sm text-foreground">Operar en Sandbox / Pruebas</span>
        </label>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg font-medium transition-colors"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Guardar MercadoPago
        </button>
      </form>
    </div>
  )
}
