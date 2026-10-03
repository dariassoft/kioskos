import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Store, ArrowLeft, CreditCard, Building2, User, Mail, Phone,
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Copy,
  QrCode, Banknote, ChevronRight, RefreshCw, FlaskConical,
} from 'lucide-react'
import checkoutApi, { type CheckoutResult, type StartCheckoutPayload, type SandboxInfo } from '@api/checkout.api'
import systemSettingsApi from '@api/system-settings.api'

// ─── Paso 1: Datos personales ──────────────────────────────────────────────────
function StepPersonalData({
  planId, planName, planPrice, onNext,
}: { planId: string; planName: string; planPrice: number; onNext: (d: Partial<StartCheckoutPayload>) => void }) {
  const [form, setForm] = useState({ business_name: '', owner_name: '', owner_email: '', owner_phone: '', tax_id: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleNext = () => {
    if (!form.business_name || !form.owner_name || !form.owner_email || !form.password) { setError('Completá todos los campos obligatorios.'); return }
    if (!/^.{6,}$/.test(form.password)) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden.'); return }
    setError('')
    onNext({ plan_id: planId, business_name: form.business_name, owner_name: form.owner_name, owner_email: form.owner_email, owner_phone: form.owner_phone || undefined, tax_id: form.tax_id || undefined, password: form.password })
  }

  return (
    <div className="space-y-5">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 flex items-center justify-between">
        <div><p className="text-sm text-indigo-600 font-medium">Plan seleccionado</p><p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{planName}</p></div>
        <div className="text-right"><p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">${planPrice.toLocaleString('es-AR')}</p><p className="text-xs text-indigo-500">/mes</p></div>
      </div>
      {error && <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Building2 className="w-3.5 h-3.5 inline mr-1" />Nombre del negocio *</label>
          <input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} className="input w-full" placeholder="Kiosko Don Pedro" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><User className="w-3.5 h-3.5 inline mr-1" />Tu nombre completo *</label>
          <input value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} className="input w-full" placeholder="Pedro González" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Mail className="w-3.5 h-3.5 inline mr-1" />Email *</label>
          <input type="email" value={form.owner_email} onChange={(e) => set('owner_email', e.target.value)} className="input w-full" placeholder="pedro@mail.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Phone className="w-3.5 h-3.5 inline mr-1" />Teléfono</label>
          <input value={form.owner_phone} onChange={(e) => set('owner_phone', e.target.value)} className="input w-full" placeholder="+54 11 9999-8888" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CUIT/CUIL</label>
          <input value={form.tax_id} onChange={(e) => set('tax_id', e.target.value)} className="input w-full" placeholder="20-12345678-9" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Lock className="w-3.5 h-3.5 inline mr-1" />Contraseña *</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} className="input w-full pr-10" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar contraseña *</label>
          <input type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} className="input w-full" placeholder="••••••••" />
        </div>
      </div>
      <button onClick={handleNext} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
        Continuar al pago <ChevronRight className="w-4 h-4" />
      </button>
      {/* Información del período contratado */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
        <RefreshCw className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Suscripción mensual:</strong> En el siguiente paso vas a elegir si querés autorizar el débito automático mensual de <strong>${planPrice.toLocaleString('es-AR')}</strong> o pagar solo este período.
        </p>
      </div>
    </div>
  )
}

// ─── Panel de Sandbox (tarjetas de prueba) ─────────────────────────────────────
function SandboxPanel({ info }: { info: SandboxInfo }) {
  if (!info.sandbox) return null
  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl space-y-3">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
        <FlaskConical className="w-4 h-4" />
        MODO SANDBOX — Pagos de prueba (NO reales)
      </div>
      <p className="text-xs text-amber-700 dark:text-amber-400">{info.instructions}</p>
      <div className="grid gap-2">
        {info.test_cards?.map((card) => (
          <div key={card.number} className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-xs">
            <span className={`px-2 py-0.5 rounded font-bold text-white ${card.result === 'Aprobado' ? 'bg-emerald-500' : 'bg-red-500'}`}>{card.result}</span>
            <span className="font-mono text-gray-700 dark:text-gray-300">{card.number}</span>
            <span className="text-gray-500">CVC: {card.cvc} · Vto: {card.expiry}</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Titular: <span className="font-mono">{card.name}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Paso 2: Método de pago ────────────────────────────────────────────────────
function StepPaymentMethod({ formData, planPrice, trialDays, onBack }: { formData: Partial<StartCheckoutPayload>; planPrice: number; trialDays: string; onBack: () => void }) {
  const navigate = useNavigate()
  const [method, setMethod] = useState<'mercadopago' | 'transfer' | 'trial' | null>(null)
  const [transferAlias, setTransferAlias] = useState('')
  const [transferNotes, setTransferNotes] = useState('')
  const [transferVoucher, setTransferVoucher] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null)
  const [transferConfirmed, setTransferConfirmed] = useState(false)
  const [isTrialing, setIsTrialing] = useState(false)
  const [autoRenew, setAutoRenew] = useState(false)

  const { data: sandboxInfo } = useQuery({
    queryKey: ['sandbox-info'],
    queryFn: checkoutApi.getSandboxInfo,
    staleTime: Infinity,
  })

  const startMutation = useMutation({
    mutationFn: (payload: StartCheckoutPayload) => checkoutApi.startCheckout(payload),
    onSuccess: (data) => {
      setCheckoutResult(data)
      if (data.is_free) {
        // Redirigir a página de éxito para planes gratuitos
        navigate(`/checkout/success?pending=${data.pending_id}`);
      } else if (data.mp_init_point) {
        // Redirigir a MercadoPago para planes pagos
        window.location.href = data.mp_init_point;
      }
    },
  })

  const confirmTransferMutation = useMutation({
    mutationFn: () => checkoutApi.confirmTransfer({ pending_id: checkoutResult?.pending_id ?? '', transfer_alias: transferAlias, transfer_notes: transferNotes, transfer_voucher: transferVoucher || undefined }),
    onSuccess: () => setTransferConfirmed(true),
  })

  const handlePay = (m: 'mercadopago' | 'transfer' | 'trial') => {
    setMethod(m)
    if (m === 'trial') setIsTrialing(true)
    startMutation.mutate({
      ...formData,
      payment_method: m,
      auto_renew: m === 'mercadopago' && autoRenew,
    } as StartCheckoutPayload)
  }

  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopiedField(key); setTimeout(() => setCopiedField(null), 2000) }

  const handleVoucher = (file?: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => setTransferVoucher(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  if (transferConfirmed) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8 text-amber-600" /></div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">¡Transferencia notificada!</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">Verificaremos tu pago y activaremos tu cuenta en las próximas horas hábiles. Te avisaremos a <strong>{formData.owner_email}</strong>.</p>
        <Link to="/" className="inline-block mt-4 text-indigo-600 hover:underline text-sm">Volver al inicio</Link>
      </div>
    )
  }

  if (checkoutResult?.transfer_data && method === 'transfer') {
    const td = checkoutResult.transfer_data
    return (
      <div className="space-y-5">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2"><Banknote className="w-5 h-5" />Datos para transferir</h3>
          {[{ label: 'Alias', value: td.alias }, { label: 'CBU', value: td.cbu }, { label: 'Importe', value: `$${Number(td.amount).toLocaleString('es-AR')}` }, { label: 'Referencia', value: td.reference }].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-sm">
              <span className="text-gray-500">{label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{value}</span>
                <button onClick={() => copy(value, label)} className="text-gray-400 hover:text-indigo-600">
                  {copiedField === label ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-amber-700 dark:text-amber-400">⚠️ Incluí la referencia <strong>{td.reference}</strong> en el concepto de la transferencia.</p>
          <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              <strong>Nota:</strong> La verificación del pago se realiza manualmente por nuestro equipo. 
              Este proceso puede demorar un par de horas. Una vez verificado, te enviaremos un email 
              a <strong>{formData.owner_email}</strong> con tus credenciales de acceso.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {(td.accounts ?? []).length > 0 && <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Elegí una cuenta receptora:</p>}
          {(td.accounts ?? []).map((account) => (
            <button key={`${account.name}-${account.alias}-${account.cbu}`} type="button" onClick={() => setTransferAlias(account.alias || account.cbu || '')} className={`w-full text-left p-3 rounded-lg border ${transferAlias === (account.alias || account.cbu) ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <p className="font-semibold text-sm">{account.name}</p>
              <p className="text-xs text-gray-500">{account.alias || account.cbu}{account.holder ? ` · ${account.holder}` : ''}</p>
            </button>
          ))}
          <h4 className="font-medium text-gray-900 dark:text-white">Una vez realizada la transferencia:</h4>
          <input value={transferAlias} onChange={(e) => setTransferAlias(e.target.value)} className="input w-full" placeholder={`¿A qué alias/CBU transferiste? (ej: ${td.alias})`} />
          <input value={transferNotes} onChange={(e) => setTransferNotes(e.target.value)} className="input w-full" placeholder="Número de comprobante o referencia (opcional)" />
          <label className="block text-xs text-gray-500">
            Adjuntar comprobante (imagen o PDF, máximo 5 MB)
            <input type="file" accept="image/*,.pdf" onChange={(event) => handleVoucher(event.target.files?.[0])} className="mt-1 block w-full text-sm" />
          </label>
          <button onClick={() => confirmTransferMutation.mutate()} disabled={!transferAlias || confirmTransferMutation.isPending}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {confirmTransferMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Ya transferí — Notificar pago
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 dark:text-gray-400">Elegí cómo pagar tu suscripción mensual:</p>

      {/* Autorización explícita de cobro recurrente */}
      <div className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs">
        <RefreshCw className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <p>Podés autorizar el débito mensual automático en MercadoPago. Si no lo autorizás, pagarás solamente este período y luego podrás renovar manualmente.</p>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/10 p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={autoRenew}
          onChange={(event) => setAutoRenew(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-blue-600"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          <strong className="block text-gray-900 dark:text-white">Autorizar renovación automática mensual</strong>
          MercadoPago cobrará ${planPrice.toLocaleString('es-AR')} por mes mientras la autorización esté activa. Podés cancelarla desde tu cuenta de MercadoPago.
        </span>
      </label>

      {/* Panel sandbox */}
      {sandboxInfo && <SandboxPanel info={sandboxInfo} />}

      {startMutation.isError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          {(startMutation.error as any)?.response?.data?.message ?? 'Error al iniciar el pago. Intentá nuevamente.'}
        </div>
      )}
      <div className="grid gap-4">
        <button onClick={() => handlePay('trial')} disabled={startMutation.isPending}
          className="group flex items-center gap-4 p-5 border-2 border-indigo-200 hover:border-indigo-500 dark:border-indigo-800 dark:hover:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl transition-all text-left disabled:opacity-60">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0"><FlaskConical className="w-6 h-6 text-white" /></div>
          <div className="flex-1">
            <p className="font-bold text-indigo-700 dark:text-indigo-300">Empezar Prueba Gratis</p>
            <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80">Usá todas las funciones por {trialDays} días sin pagar nada hoy.</p>
          </div>
          {startMutation.isPending && isTrialing ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> : <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:text-indigo-500 transition-colors" />}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-gray-500 font-bold">O suscribite ahora</span></div>
        </div>

        <button onClick={() => handlePay('mercadopago')} disabled={startMutation.isPending}
          className="group flex items-center gap-4 p-5 border-2 border-blue-200 hover:border-blue-500 dark:border-blue-800 dark:hover:border-blue-500 bg-white dark:bg-gray-800 rounded-xl transition-all text-left disabled:opacity-60">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0"><QrCode className="w-6 h-6 text-white" /></div>
          <div className="flex-1"><p className="font-semibold text-gray-900 dark:text-white">Pagar con MercadoPago</p><p className="text-sm text-gray-500">Tarjeta de crédito, débito o saldo MP. {autoRenew ? 'Se configurará el débito mensual.' : 'Pago único de este período.'}</p></div>
          {startMutation.isPending && method === 'mercadopago' ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />}
        </button>
        <button onClick={() => handlePay('transfer')} disabled={startMutation.isPending}
          className="group flex items-center gap-4 p-5 border-2 border-amber-200 hover:border-amber-500 dark:border-amber-800 dark:hover:border-amber-500 bg-white dark:bg-gray-900 rounded-xl transition-all text-left disabled:opacity-60">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0"><Banknote className="w-6 h-6 text-white" /></div>
          <div className="flex-1"><p className="font-semibold text-gray-900 dark:text-white">Transferencia bancaria</p><p className="text-sm text-gray-500">Por alias o CBU. Verificación manual (1-2 horas).</p></div>
          {startMutation.isPending && method === 'transfer' ? <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> : <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />}
        </button>
      </div>
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 mt-2">
        <ArrowLeft className="w-3.5 h-3.5" /> Volver a mis datos
      </button>
    </div>
  )
}

// ─── Página principal de Checkout ─────────────────────────────────────────────
export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('plan') ?? ''
  const refCode = searchParams.get('ref') ?? ''
  const [step, setStep] = useState<1 | 2>(1)
  const [formData, setFormData] = useState<Partial<StartCheckoutPayload>>({
    referred_by_code: refCode || undefined
  })

  const { data: plans = [], isLoading } = useQuery({ queryKey: ['public-plans'], queryFn: checkoutApi.getPlans })
  const { data: systemInfo = {} } = useQuery({ queryKey: ['system-public-info'], queryFn: systemSettingsApi.getPublicInfo })
  const selectedPlan = plans.find((p) => p.id === planId)

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
  if (!selectedPlan) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4"><AlertCircle className="w-12 h-12 text-red-500 mx-auto" /><p className="text-gray-600">Plan no encontrado.</p><Link to="/#planes" className="text-indigo-600 hover:underline">Ver planes disponibles</Link></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Store className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-gray-900 dark:text-white">Kioskos & Despenzas</span>
          </Link>
          <Link to="/login" className="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400">¿Ya tenés cuenta? Ingresá</Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className={`flex items-center gap-2 text-sm font-medium ${step === 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>{step === 1 ? '1' : <CheckCircle2 className="w-4 h-4" />}</span>
              Tus datos
            </div>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <div className={`flex items-center gap-2 text-sm font-medium ${step === 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}><CreditCard className="w-3.5 h-3.5" /></span>
              Pago
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
            {step === 1 && <StepPersonalData planId={selectedPlan.id} planName={selectedPlan.name} planPrice={Number(selectedPlan.price_monthly)} onNext={(d) => { setFormData((previous) => ({ ...previous, ...d, referred_by_code: previous.referred_by_code })); setStep(2) }} />}
            {step === 2 && <StepPaymentMethod formData={formData} planPrice={Number(selectedPlan.price_monthly)} trialDays={systemInfo.trial_days || '3'} onBack={() => setStep(1)} />}
          </div>
          <p className="text-center text-xs text-gray-500 mt-6">🔒 Tus datos están protegidos. Pagos procesados por MercadoPago.</p>
        </div>
      </main>
    </div>
  )
}
