import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSaveAfipCredentials, useTestAfipConnection, useAfipCredentials } from '@/hooks/useAfip'
import { AfipAuthMode, TipoIva, type SaveAfipCredentialsDto } from '@/api/afip.types'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FlaskConical,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
} from 'lucide-react'

const tipoIvaOptions: Array<{ value: TipoIva; label: string }> = [
  { value: TipoIva.MONOTRIBUTISTA, label: 'Monotributista' },
  { value: TipoIva.RESPONSABLE_INSCRIPTO, label: 'Responsable Inscripto' },
]

export default function AfipTab() {
  const { data: credentials, isLoading, isError } = useAfipCredentials()
  const saveAfip = useSaveAfipCredentials()
  const testAfip = useTestAfipConnection()
  const [initialized, setInitialized] = useState(false)
  const [form, setForm] = useState<SaveAfipCredentialsDto>({
	auth_mode: AfipAuthMode.ACCESS_TOKEN,
	cuit: '',
	certificate: '',
	private_key: '',
	access_token: '',
	punto_de_venta: 1,
	razon_social: '',
	tipo_iva: TipoIva.MONOTRIBUTISTA,
	production_mode: false,
  })

  useEffect(() => {
	if (!credentials || initialized) return

	setForm((current) => ({
	  ...current,
	  auth_mode: credentials.auth_mode,
	  punto_de_venta: credentials.punto_de_venta,
	  razon_social: credentials.razon_social,
	  tipo_iva: credentials.tipo_iva,
	  production_mode: credentials.production_mode,
	  cuit: '',
	  certificate: '',
	  private_key: '',
	  access_token: '',
	}))
	setInitialized(true)
  }, [credentials, initialized])

  const handleSave = () => {
	const accessToken = form.access_token?.trim() ?? ''
	const certificate = form.certificate?.trim() ?? ''
	const privateKey = form.private_key?.trim() ?? ''

	if (!form.cuit.trim()) {
	  toast.error('Completá el CUIT para guardar la configuración de ARCA')
	  return
	}

	if (!form.razon_social.trim()) {
	  toast.error('Completá la razón social para guardar la configuración de ARCA')
	  return
	}

	const payload: SaveAfipCredentialsDto = {
	  auth_mode: form.auth_mode,
	  cuit: form.cuit.trim(),
	  punto_de_venta: Number(form.punto_de_venta),
	  razon_social: form.razon_social.trim(),
	  tipo_iva: form.tipo_iva,
	  production_mode: form.production_mode,
	}

	if (form.auth_mode === AfipAuthMode.ACCESS_TOKEN) {
	  if (!accessToken) {
		toast.error('Ingresá el access token para usar el modo access_token')
		return
	  }
	  payload.access_token = accessToken
	}

	if (form.auth_mode === AfipAuthMode.CERTIFICATE) {
	  if (!certificate || !privateKey) {
		toast.error('Ingresá certificado y clave privada para usar el modo certificate')
		return
	  }
	  payload.certificate = certificate
	  payload.private_key = privateKey
	}

	saveAfip.mutate(payload, {
	  onSuccess: () => {
			  toast.success('Configuración de ARCA guardada correctamente')
		setInitialized(true)
		setForm((current) => ({
		  ...current,
		  certificate: '',
		  private_key: '',
		  access_token: '',
		}))
	  },
	  onError: () => {
		toast.error('Error al guardar la configuración de ARCA')
	  },
	})
  }

  const handleTest = () => {
	testAfip.mutate(undefined, {
	  onSuccess: (response) => toast.success(response.message),
	  onError: () => toast.error('No se pudo probar la conexión con ARCA'),
	})
  }

  if (isLoading) {
	return (
	  <div className="flex items-center justify-center h-48 text-muted-foreground">
		<Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando configuración de ARCA...
	  </div>
	)
  }

  if (isError) {
	return (
	  <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
		<AlertCircle className="w-5 h-5" /> Error al cargar la configuración de ARCA.
	  </div>
	)
  }

  return (
	<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
	  <div className="xl:col-span-2 space-y-6">
		<div className="card p-6 border border-border rounded-xl">
		  <div className="flex items-center gap-3 mb-6">
			<FileText className="w-5 h-5 text-muted-foreground" />
			<div>
			  <h2 className="text-base font-semibold text-foreground">Configuración ARCA</h2>
			  <p className="text-xs text-muted-foreground">
				Las credenciales se guardan encriptadas y solo el tenant activo puede usarlas.
			  </p>
			</div>
		  </div>

		  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
			<div>
			  <label className="block text-sm font-medium text-foreground mb-1">CUIT *</label>
			  <input
				value={form.cuit}
				onChange={(e) => setForm((current) => ({ ...current, cuit: e.target.value }))}
				className="input w-full"
				placeholder="20-12345678-9"
			  />
			</div>
			<div>
			  <label className="block text-sm font-medium text-foreground mb-1">Razón social *</label>
			  <input
				value={form.razon_social}
				onChange={(e) => setForm((current) => ({ ...current, razon_social: e.target.value }))}
				className="input w-full"
				placeholder="Kioskos y Despenzas SRL"
			  />
			</div>
			<div>
			  <label className="block text-sm font-medium text-foreground mb-1">Punto de venta *</label>
			  <input
				type="number"
				min={1}
				value={form.punto_de_venta}
				onChange={(e) => setForm((current) => ({ ...current, punto_de_venta: Number(e.target.value) || 1 }))}
				className="input w-full"
				placeholder="1"
			  />
			</div>
			<div>
			  <label className="block text-sm font-medium text-foreground mb-1">Tipo de IVA *</label>
			  <select
				value={form.tipo_iva}
				onChange={(e) => setForm((current) => ({ ...current, tipo_iva: e.target.value as TipoIva }))}
				className="input w-full"
			  >
				{tipoIvaOptions.map((option) => (
				  <option key={option.value} value={option.value}>
					{option.label}
				  </option>
				))}
			  </select>
			</div>
		  </div>

		  <div className="space-y-4">
			<div>
			  <label className="block text-sm font-medium text-foreground mb-2">Modo de autenticación</label>
			  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<button
				  type="button"
				  onClick={() => setForm((current) => ({ ...current, auth_mode: AfipAuthMode.ACCESS_TOKEN }))}
				  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
					form.auth_mode === AfipAuthMode.ACCESS_TOKEN
					  ? 'border-violet-500 bg-violet-500/10 text-violet-400'
					  : 'border-border text-muted-foreground hover:border-border/80'
				  }`}
				>
				  <ShieldCheck className="w-4 h-4" />
				  <span className="text-sm font-medium">Access token</span>
				</button>
				<button
				  type="button"
				  onClick={() => setForm((current) => ({ ...current, auth_mode: AfipAuthMode.CERTIFICATE }))}
				  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
					form.auth_mode === AfipAuthMode.CERTIFICATE
					  ? 'border-violet-500 bg-violet-500/10 text-violet-400'
					  : 'border-border text-muted-foreground hover:border-border/80'
				  }`}
				>
				  <Lock className="w-4 h-4" />
				  <span className="text-sm font-medium">Certificado + clave</span>
				</button>
			  </div>
			</div>

			{form.auth_mode === AfipAuthMode.ACCESS_TOKEN ? (
			  <div>
				<label className="block text-sm font-medium text-foreground mb-1">Access token *</label>
				<textarea
				  value={form.access_token}
				  onChange={(e) => setForm((current) => ({ ...current, access_token: e.target.value }))}
				  className="input w-full min-h-[120px]"
						placeholder="Pegá aquí el access token de ARCA / AfipSDK"
				/>
			  </div>
			) : (
			  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
				  <label className="block text-sm font-medium text-foreground mb-1">Certificado (.crt) *</label>
				  <textarea
					value={form.certificate}
					onChange={(e) => setForm((current) => ({ ...current, certificate: e.target.value }))}
					className="input w-full min-h-[160px]"
					placeholder="-----BEGIN CERTIFICATE-----..."
				  />
				</div>
				<div>
				  <label className="block text-sm font-medium text-foreground mb-1">Clave privada (.key) *</label>
				  <textarea
					value={form.private_key}
					onChange={(e) => setForm((current) => ({ ...current, private_key: e.target.value }))}
					className="input w-full min-h-[160px]"
					placeholder="-----BEGIN PRIVATE KEY-----..."
				  />
				</div>
			  </div>
			)}

			<label className="flex items-center gap-3 text-sm text-foreground">
			  <input
				type="checkbox"
				checked={form.production_mode}
				onChange={(e) => setForm((current) => ({ ...current, production_mode: e.target.checked }))}
				className="rounded border-border text-violet-600 focus:ring-violet-500"
			  />
			  Activar modo producción real de ARCA
			</label>
		  </div>

		  <div className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
			<p className="text-xs text-muted-foreground">
			  Si dejás desactivado producción, la integración trabaja en modo homologación / pruebas.
			</p>
			<div className="flex gap-3">
			  <button
				type="button"
				onClick={handleTest}
				disabled={testAfip.isPending}
				className="px-4 py-2 border border-border rounded-xl text-sm text-foreground hover:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
			  >
				{testAfip.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
				Probar conexión
			  </button>
			  <button
				type="button"
				onClick={handleSave}
				disabled={saveAfip.isPending}
				className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
			  >
				{saveAfip.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
				Guardar cambios
			  </button>
			</div>
		  </div>
		</div>
	  </div>

	  <div className="space-y-4">
		<div className="card p-5 border border-border rounded-xl space-y-3">
		  <h3 className="text-sm font-semibold text-foreground">Estado ARCA</h3>
		  {credentials?.is_configured ? (
			<>
			  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-600">
				<CheckCircle2 className="w-4 h-4" /> Configurado
			  </span>
			  <div className="space-y-2 text-sm text-muted-foreground">
				<p><span className="text-foreground">Razón social:</span> {credentials.razon_social}</p>
				<p><span className="text-foreground">CUIT:</span> {credentials.cuit_masked}</p>
				<p><span className="text-foreground">Pto. venta:</span> {credentials.punto_de_venta}</p>
				<p><span className="text-foreground">Modo:</span> {credentials.production_mode ? 'Producción' : 'Homologación'}</p>
				<p><span className="text-foreground">Autenticación:</span> {credentials.auth_mode}</p>
			  </div>
			</>
		  ) : (
			<>
			  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-amber-500/10 text-amber-600">
				<AlertCircle className="w-4 h-4" /> Pendiente de configuración
			  </span>
			  <p className="text-xs text-muted-foreground">
				Todavía no se cargaron credenciales de ARCA para este tenant.
			  </p>
			</>
		  )}
		</div>

		<div className="card p-5 border border-border rounded-xl space-y-3">
		  <div className="flex items-center gap-2">
			<FlaskConical className="w-4 h-4 text-muted-foreground" />
			<h3 className="text-sm font-semibold text-foreground">Consejo de pruebas</h3>
		  </div>
		  <p className="text-xs text-muted-foreground leading-5">
			Usá homologación primero y validá tus CAE antes de activar producción. Cuando cambies el CUIT o la clave,
			volvé a probar la conexión desde este mismo panel.
		  </p>
		</div>
	  </div>
	</div>
  )
}


