import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Store, Package, ShoppingCart, Users, BarChart3, BookOpen, Truck,
  CheckCircle2, ArrowRight, Star, Zap, Shield, Globe, ChevronRight,
  QrCode, Banknote, CreditCard, Building2, Download
} from 'lucide-react'
import checkoutApi, { type PublicPlan } from '@api/checkout.api'
import { usePWA } from '@hooks/usePWA'

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const { isInstallable, isInstalled, installApp } = usePWA()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-lg">Kioskos & Despenzas</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          <a href="#funciones" className="hover:text-indigo-600 transition-colors">Funciones</a>
          <a href="#como-funciona" className="hover:text-indigo-600 transition-colors">Cómo funciona</a>
          <a href="#planes" className="hover:text-indigo-600 transition-colors">Planes</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Ingresar
          </Link>
          {isInstallable && !isInstalled && (
            <button
              onClick={installApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-bold rounded-lg transition-colors border border-indigo-200 animate-pulse"
              title="Instalar aplicación"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">INSTALAR APP</span>
            </button>
          )}
          <a href="#planes" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Empezar gratis <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 px-4 overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 dark:bg-indigo-900/30 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl opacity-30" />
      </div>
      <div className="relative max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-700/50">
          <Zap className="w-3.5 h-3.5" />
          Sistema ERP + POS para kioskos y despensas
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
          Gestioná tu negocio<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">desde cualquier lugar</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Control de inventario, punto de venta, clientes con fiado, proveedores y reportes — todo en un solo sistema fácil de usar. Sin complicaciones.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#planes" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/25">
            Elegir mi plan <ArrowRight className="w-5 h-5" />
          </a>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-4 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
            Ya tengo cuenta →
          </Link>
        </div>
        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 pt-6">
          {[
            { label: 'Planes desde', value: '$0/mes' },
            { label: 'Sucursales', value: 'Ilimitadas' },
            { label: 'Sin instalación', value: '100% web' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Funciones ────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: ShoppingCart, color: 'bg-blue-500', title: 'POS Punto de Venta', desc: 'Terminal rápida para cobrar en efectivo, tarjeta o fiado. Con búsqueda por código de barras o nombre.' },
  { icon: Package, color: 'bg-emerald-500', title: 'Inventario Multisucursal', desc: 'Control de stock por sucursal con alertas automáticas cuando el stock baja del mínimo.' },
  { icon: Users, color: 'bg-purple-500', title: 'Clientes y Fiados', desc: 'Administrá cuentas corrientes de clientes. Registrá deudas y abonos con historial completo.' },
  { icon: Truck, color: 'bg-orange-500', title: 'Proveedores y Compras', desc: 'Gestioná órdenes de compra. Al recibirlas, el stock se actualiza automáticamente.' },
  { icon: BookOpen, color: 'bg-rose-500', title: 'Contabilidad Automática', desc: 'Cada venta y compra genera asientos contables automáticos. Libro diario siempre al día.' },
  { icon: BarChart3, color: 'bg-cyan-500', title: 'Reportes y Dashboard', desc: 'Métricas de ventas, productos más vendidos, margen de ganancia. Exportación PDF/Excel.' },
  { icon: Building2, color: 'bg-amber-500', title: 'Gestión de Sucursales', desc: 'Agregá sucursales, asigná usuarios por rol y controlá todo desde un único panel.' },
  { icon: Shield, color: 'bg-indigo-500', title: 'Multi-usuario con Roles', desc: 'Roles de Cajero, Gerente y Administrador. Cada usuario ve solo lo que necesita.' },
]

function FeaturesSection() {
  return (
    <section id="funciones" className="py-24 px-4 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Todo lo que necesita tu negocio</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Un sistema completo diseñado específicamente para kioskos, despensas y pequeños comercios.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="group p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-lg transition-all bg-white dark:bg-gray-900">
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Cómo funciona ────────────────────────────────────────────────────────────
const STEPS = [
  { n: '01', title: 'Elegí tu plan', desc: 'Seleccioná el plan que mejor se adapta a tu negocio. Podés cambiar cuando quieras.' },
  { n: '02', title: 'Realizá el pago', desc: 'Pagá con MercadoPago (tarjeta, QR) o por transferencia bancaria. Tu cuenta se activa automáticamente.' },
  { n: '03', title: 'Configurá tu negocio', desc: 'Cargá tus productos, sucursales y usuarios en minutos. Te guiamos paso a paso.' },
  { n: '04', title: '¡Empezá a vender!', desc: 'Tu POS, inventario y reportes funcionando desde el primer día. Sin complicaciones.' },
]

function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-950">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">¿Cómo funciona?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">Desde el registro hasta tu primer venta en menos de 10 minutos.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="relative text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
                <span className="text-xl font-black text-white">{n}</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        {/* Pagos aceptados */}
        <div className="mt-16 p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-center font-semibold text-gray-900 dark:text-white mb-6">Métodos de pago aceptados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <QrCode className="w-8 h-8 text-blue-600" />
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">MercadoPago</p>
                <p className="text-xs text-gray-500 mt-1">Tarjeta de crédito, débito, pago QR desde cualquier billetera, saldo MP. Acreditación inmediata.</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <Banknote className="w-8 h-8 text-amber-600" />
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Transferencia bancaria</p>
                <p className="text-xs text-gray-500 mt-1">Por alias o CBU (Brubank, Uala, Naranja X, cualquier banco). Verificación en horas hábiles.</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <CreditCard className="w-8 h-8 text-emerald-600" />
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Seguro y protegido</p>
                <p className="text-xs text-gray-500 mt-1">Los pagos con tarjeta son procesados por MercadoPago con cifrado SSL. Tu información siempre segura.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Planes ───────────────────────────────────────────────────────────────────
const FEATURE_LABELS: Record<string, string> = {
  accounting: 'Contabilidad automática',
  multisite: 'Múltiples sucursales',
  reports_advanced: 'BI y reportes avanzados',
  reports_history: 'Historial de reportes',
  email_alerts: 'Alertas por email',
  bulk_import: 'Importación masiva',
  pdf_export: 'Exportación PDF/Excel',
  pdf_excel: 'Exportación PDF/Excel',
  fiados: 'Cuentas corrientes (fiados)',
  pos: 'Terminal POS',
  inventory: 'Gestión de inventario',
}

function PlanCard({ plan, isPopular }: { plan: PublicPlan; isPopular: boolean }) {
  const navigate = useNavigate()

  return (
    <div className={`relative flex flex-col rounded-2xl border-2 p-8 transition-all ${
      isPopular
        ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/10 dark:to-gray-900'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg'
    }`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg">
            <Star className="w-3 h-3" /> MÁS POPULAR
          </span>
        </div>
      )}
      <div className="space-y-2 mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
      </div>
      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
            ${Number(plan.price_monthly).toLocaleString('es-AR')}
          </span>
          <span className="text-gray-500 dark:text-gray-400 mb-1">/mes</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Hasta {plan.max_users >= 9999 ? '∞' : plan.max_users} usuario{plan.max_users !== 1 ? 's' : ''} · {plan.max_branches >= 9999 ? '∞' : plan.max_branches} sucursal{plan.max_branches !== 1 ? 'es' : ''}
        </p>
      </div>
      <ul className="space-y-3 flex-1 mb-8">
        {plan.features ? Object.entries(plan.features).map(([key, enabled]) => (
          <li key={key} className={`flex items-center gap-2.5 text-sm ${enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600 line-through'}`}>
            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${enabled ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}`} />
            {FEATURE_LABELS[key] ?? key.replace(/_/g, ' ')}
          </li>
        )) : (
          <li className="text-xs text-muted-foreground italic">Sin características detalladas</li>
        )}
      </ul>
      <button
        onClick={() => navigate(`/checkout?plan=${plan.id}`)}
        className={`w-full py-3.5 rounded-xl font-semibold transition-all text-sm flex items-center justify-center gap-2 ${
          isPopular
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25'
            : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
        }`}>
        Suscribirse ahora <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function PricingSection({ plans }: { plans: PublicPlan[] }) {
  const popularIndex = plans.length > 1 ? 1 : 0
  return (
    <section id="planes" className="py-24 px-4 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Planes y precios</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Sin contratos. Sin costos ocultos. Cambiá o cancelá cuando quieras.
          </p>
        </div>
        {!Array.isArray(plans) || plans.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            {plans && !Array.isArray(plans) ? 'Error al cargar los planes' : 'Cargando planes...'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {plans.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} isPopular={i === popularIndex} />
            ))}
          </div>
        )}
        <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-8">
          ¿Tenés preguntas? Escribinos a <a href="mailto:hola@kioskos.com" className="text-indigo-600 hover:underline">hola@kioskos.com</a>
        </p>
      </div>
    </section>
  )
}

// ─── CTA Final ────────────────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-r from-indigo-600 to-violet-600">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Tu negocio, ordenado y bajo control
        </h2>
        <p className="text-indigo-100 text-lg max-w-xl mx-auto">
          Unite a los comerciantes que ya usan Kioskos & Despenzas para gestionar su negocio de forma simple y profesional.
        </p>
        <a href="#planes" className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-indigo-600 font-semibold text-lg rounded-xl transition-colors shadow-lg">
          Empezar hoy <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 px-4 bg-gray-950 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Kioskos & Despenzas</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <a href="#funciones" className="hover:text-white transition-colors">Funciones</a>
            <a href="#planes" className="hover:text-white transition-colors">Planes</a>
            <Link to="/login" className="hover:text-white transition-colors">Ingresar</Link>
            <a href="mailto:hola@kioskos.com" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Kioskos & Despenzas. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data: plans = [] } = useQuery({
    queryKey: ['public-plans'],
    queryFn: checkoutApi.getPlans,
    staleTime: 5 * 60 * 1000,
  })

  // Smooth scroll para anclas
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [])

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection plans={plans} />
      <CtaSection />
      <Footer />
    </div>
  )
}
