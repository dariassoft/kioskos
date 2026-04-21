import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Store, ShoppingCart, Users, BarChart3, BookOpen, Truck,
  CheckCircle2, ArrowRight, Star, Zap, Shield, Globe, ChevronRight,
  QrCode, CreditCard, Building2, MousePointer2,
  BellRing, Tags, Layers, Ruler, Share2, Gift
} from 'lucide-react'
import checkoutApi, { type PublicPlan } from '@api/checkout.api'
import { usePWA } from '@hooks/usePWA'

// --- Navbar ---
function Navbar() {
  usePWA()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="font-black text-lg sm:text-xl tracking-tighter text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-none">Kioskos & Despenzas</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600 dark:text-gray-400">
          <a href="#funciones" className="hover:text-indigo-600 transition-colors relative group">
            Funciones
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full" />
          </a>
          <a href="#vistas" className="hover:text-indigo-600 transition-colors relative group">
            Galería
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full" />
          </a>
          <a href="#planes" className="hover:text-indigo-600 transition-colors relative group">
            Planes
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full" />
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden xs:inline-flex text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3 py-2">
            Ingresar
          </Link>
          {/* Botón Instalar removido de aquí */}
          <a href="#planes" className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 whitespace-nowrap min-w-[100px] justify-center">
            Probar Gratis <ChevronRight className="w-3 h-3 sm:w-4 h-4" />
          </a>
        </div>
      </div>
    </nav>
  )
}

// --- Hero ---
function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 px-4 overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-gray-950 dark:to-gray-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-200/40 dark:bg-indigo-900/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 overflow-x-hidden">
        <div className="flex-1 text-center lg:text-left space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 text-indigo-700 dark:text-indigo-400 rounded-2xl text-xs font-bold border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            NUEVA VERSIÓN 2026 DISPONIBLE
          </div>
          <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight px-2 sm:px-0">
            Controlá tu negocio <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">sin complicaciones.</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium px-4 sm:px-0">
            Diseñado para personas que quieren ver crecer su kiosco o despensa. Gestioná stock, ventas, fiados y proveedores desde tu celular o PC. <b>Fácil, rápido y profesional.</b>
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4 px-2 sm:px-0">
            <a href="#planes" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-base sm:text-lg font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/30 active:scale-[0.98]">
              Empezar 3 Días Gratis <ArrowRight className="w-5 h-5" />
            </a>
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <p className="text-xs font-bold text-gray-500">+500 negocios activos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative w-full max-w-md lg:max-w-none">
          <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 rotate-2 hover:rotate-0 transition-transform duration-500">
             <img src="/img/dashboard.png" alt="App Dashboard" className="w-full h-auto" />
          </div>
          <div className="absolute -bottom-6 -left-6 z-20 w-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 -rotate-3 hover:rotate-0 transition-transform duration-500 hidden sm:block">
             <img src="/img/mobile.png" alt="Mobile App" className="w-full h-auto" />
          </div>
          <div className="absolute top-1/2 -right-4 sm:-right-8 w-20 h-20 sm:w-24 sm:h-24 bg-indigo-600 text-white rounded-3xl flex flex-col items-center justify-center shadow-2xl animate-bounce pointer-events-none z-30">
            <QrCode className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            <span className="text-[8px] font-black uppercase mt-1">Scan Me</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// --- Showcase Section ---
function ShowcaseSection() {
  return (
    <section id="vistas" className="py-24 px-4 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight">
            Una experiencia diseñada para vos
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            No necesitás ser un experto en computación. Kioskos & Despenzas es tan simple como usar WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 space-y-10">
            {[
              { 
                icon: MousePointer2, 
                title: 'Terminal POS Ultrarrápida', 
                desc: 'Buscá por código de barras o nombre. Cobrá en segundos y entregá tickets profesionales.',
                img: '/img/pos.png'
              },
              { 
                icon: BellRing, 
                title: 'Alertas de Stock Inteligentes', 
                desc: 'Recibí notificaciones cuando un producto se esté por terminar. Nunca más te quedes sin mercadería.',
                img: '/img/mobile.png'
              },
              { 
                icon: BarChart3, 
                title: 'Reportes que se entienden', 
                desc: 'Mirá cuánto ganaste hoy, qué producto se vende más y cómo va tu negocio desde cualquier lugar.',
                img: '/img/dashboard.png'
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                  <item.icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400 group-hover:text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="order-1 lg:order-2 relative inline-block">
            <div className="aspect-video rounded-[2.5rem] bg-indigo-600/5 dark:bg-indigo-400/5 p-4 sm:p-8">
              <div className="w-full h-full rounded-[1.5rem] overflow-hidden shadow-2xl border-2 border-white dark:border-gray-800">
                <img src="/img/pos.png" alt="POS View" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 bg-indigo-600 text-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-2xl z-20">
              <p className="text-xl sm:text-2xl font-black italic">100% Mobile</p>
              <p className="text-[10px] sm:text-xs font-bold opacity-80 tracking-widest uppercase">Optimizado para celulares</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// --- Funciones ---
const FEATURES = [
  { icon: ShoppingCart, color: 'bg-blue-500', title: 'POS Punto de Venta', desc: 'Cada usuario es una caja registradora. Gestioná cajeros, ventas rápidas y medios de pago.' },
  { icon: Building2, color: 'bg-emerald-500', title: 'Múltiples Sucursales', desc: 'Controlá todos tus locales desde una sola cuenta. Reponé stock y compará ventas entre sedes.' },
  { icon: Users, color: 'bg-purple-500', title: 'Fiados y Clientes', desc: 'Llevá la cuenta corriente de tus vecinos. Registrá deudas y pagos sin perder un solo peso.' },
  { icon: Globe, color: 'bg-amber-500', title: 'Factura Electrónica (AFIP)', desc: 'Emití facturas C, A o B con validez fiscal de forma automática al cerrar una venta.' },
  { icon: Tags, color: 'bg-orange-500', title: 'Marcas y Categorías', desc: 'Organizá tu catálogo. Creá marcas y categorías dinámicas para un orden profesional.' },
  { icon: Layers, color: 'bg-rose-500', title: 'Gestión de Stock Mínimo', desc: 'Definí alertas por cada producto. El sistema te avisa antes de que te quedes sin stock.' },
  { icon: BarChart3, color: 'bg-cyan-500', title: 'Márgenes de Ganancia', desc: 'Ajustá precios por monto o porcentaje masivamente. Controlá tu rentabilidad real.' },
  { icon: Truck, color: 'bg-indigo-500', title: 'Compras y Proveedores', desc: 'Registrá facturas de compra y actualizá costos y stock automáticamente.' },
  { icon: BookOpen, color: 'bg-emerald-600', title: 'Contabilidad Automática', desc: 'No necesitás ser contador. El sistema genera los asientos contables de cada movimiento.' },
  { icon: Ruler, color: 'bg-pink-500', title: 'Unidades de Medida', desc: 'Vendé por unidad, kilo, litro o pack. El sistema maneja cualquier tipo de presentación.' },
  { icon: Shield, color: 'bg-gray-800', title: 'Roles y Seguridad', desc: 'Cajeros, Encargados y Dueños. Controlá qué puede ver y hacer cada integrante del equipo.' },
  { icon: CreditCard, color: 'bg-blue-600', title: 'Control de Caja', desc: 'Aperturas y cierres de caja detallados. Conciliá efectivo, tarjetas y transferencias.' },
]

function FeaturesSection() {
  return (
    <section id="funciones" className="py-24 px-4 bg-gray-50/50 dark:bg-gray-900/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white">Todo lo que tu negocio necesita</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
            Una herramienta potente que se adapta al tamaño de tu comercio. De emprendedores para emprendedores.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="group p-8 rounded-[2rem] border border-transparent bg-white dark:bg-gray-900 hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
              <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- Referral Section ---
function ReferralSection() {
  return (
    <section className="py-24 px-4 bg-indigo-600 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>
      <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/20 text-white rounded-full text-sm font-black tracking-widest uppercase">
          <Gift className="w-4 h-4" /> PROGRAMA DE REFERIDOS
        </div>
        <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight">
          Invitá a un amigo y <br />
          <span className="text-indigo-200">¡Ganan los dos!</span>
        </h2>
        <p className="text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed font-medium">
          Compartí tu código de referido desde el panel de control. Si tu amigo se suscribe, ambos reciben un <b>5% de descuento mensual</b> durante el primer mes de uso. ¡Crecer juntos es más fácil!
        </p>
        <div className="flex justify-center pt-4">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 shadow-2xl">
            <Share2 className="w-12 h-12 text-white mx-auto mb-6" />
            <p className="text-white font-bold text-lg">¿Cómo funciona?</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-8 text-indigo-50 text-sm font-bold uppercase tracking-wider">
               <div className="flex flex-col gap-2">
                 <span className="text-3xl font-black">01</span>
                 <span>Compartí tu link</span>
               </div>
               <div className="flex flex-col gap-2">
                 <span className="text-3xl font-black">02</span>
                 <span>Tu amigo se une</span>
               </div>
               <div className="flex flex-col gap-2">
                 <span className="text-3xl font-black">03</span>
                 <span>¡Ambos ganan!</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// --- Planes ---
const FEATURE_LABELS: Record<string, string> = {
  pos_terminal: 'Terminal POS (Punto de Venta)',
  inventory: 'Control de Inventario y Stock',
  barcode_scanner: 'Soporte para Código de Barras',
  categories_brands: 'Categorías y Marcas',
  customers_credit: 'Clientes y Cuentas Corrientes',
  purchases_suppliers: 'Compras y Proveedores',
  automated_accounting: 'Contabilidad Automática',
  reports_bi: 'Reportes Avanzados y BI',
  export_pdf_excel: 'Exportación PDF/Excel',
  multi_branch: 'Gestión Multi-sucursal',
  electronic_invoicing: 'Facturación Electrónica AFIP',
  email_notifications: 'Alertas por Email',
  priority_support: 'Soporte Prioritario',
  daily_backups: 'Backups Diarios en la Nube',
  ai_assistant: 'Asistente de Compras con IA'
}

function PlanCard({ plan, isPopular }: { plan: PublicPlan; isPopular: boolean }) {
  const navigate = useNavigate()

  return (
    <div className={`relative flex flex-col rounded-[2.5rem] border-2 p-10 transition-all ${
      isPopular
        ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 bg-white dark:bg-gray-900 scale-105 z-10'
        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-xl opacity-90 hover:opacity-100'
    }`}>
      {isPopular && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black rounded-full shadow-lg tracking-widest uppercase">
            <Star className="w-3.5 h-3.5 fill-current" /> RECOMENDADO
          </span>
        </div>
      )}
      <div className="space-y-2 mb-8 text-center sm:text-left">
        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{plan.name}</h3>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">{plan.description}</p>
      </div>
      <div className="mb-8 p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 text-center sm:text-left">
        <div className="flex items-end justify-center sm:justify-start gap-1">
          <span className="text-5xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">
            ${Number(plan.price_monthly).toLocaleString('es-AR')}
          </span>
          <span className="text-gray-500 dark:text-gray-400 font-bold mb-1 tracking-tight">/mes</span>
        </div>
        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 uppercase tracking-widest">
          3 DÍAS DE PRUEBA TOTALMENTE GRATIS
        </p>
      </div>
      
      <div className="space-y-6 flex-1 mb-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacidad</p>
          <div className="flex flex-wrap gap-4 pt-1">
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                 <ShoppingCart className="w-3 h-3 text-indigo-600" />
               </div>
               <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{plan.max_users >= 9999 ? 'POS Ilimitados' : `${plan.max_users} POS/Usuarios`}</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                 <Building2 className="w-3 h-3 text-emerald-600" />
               </div>
               <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{plan.max_branches >= 9999 ? 'Locales Ilimitados' : `${plan.max_branches} Local/Sucursal`}</span>
             </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Características</p>
          <ul className="space-y-4">
            {plan.features ? Object.entries(plan.features).map(([key, enabled]) => (
              <li key={key} className={`flex items-start gap-3 text-sm font-bold ${enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600 line-through opacity-50'}`}>
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${enabled ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <CheckCircle2 className={`w-3 h-3 ${enabled ? 'text-emerald-600' : 'text-gray-400'}`} />
                </div>
                <span className="leading-tight">{FEATURE_LABELS[key] ?? key.replace(/_/g, ' ')}</span>
              </li>
            )) : (
              <li className="text-xs text-muted-foreground italic">Sin características detalladas</li>
            )}
          </ul>
        </div>
      </div>
      
      <button
        onClick={() => navigate(`/checkout?plan=${plan.id}`)}
        className={`w-full py-5 rounded-[1.5rem] font-black transition-all text-sm flex items-center justify-center gap-3 group/btn ${
          isPopular
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 active:scale-[0.98]'
            : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 active:scale-[0.98]'
        }`}>
        SELECCIONAR PLAN <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  )
}

function PricingSection({ plans: fetchedPlans }: { plans: PublicPlan[] }) {
  const popularIndex = 1
  
  const mockPlans: PublicPlan[] = [
    { 
      id: 'plan_emprendedor', 
      name: 'Emprendedor', 
      description: 'Ideal para quienes recién comienzan su negocio.', 
      price_monthly: 8500, 
      max_branches: 1, 
      max_users: 1, 
      features: { 
        pos_terminal: true, 
        inventory: true, 
        barcode_scanner: true, 
        customers_credit: true, 
        reports_bi: true,
        automated_accounting: false,
        electronic_invoicing: false,
        email_notifications: true
      } 
    },
    { 
      id: 'plan_negocio', 
      name: 'Negocio', 
      description: 'Para comercios en crecimiento con múltiples empleados.', 
      price_monthly: 15000, 
      max_branches: 3, 
      max_users: 3, 
      features: { 
        pos_terminal: true, 
        inventory: true, 
        barcode_scanner: true, 
        customers_credit: true, 
        reports_bi: true,
        automated_accounting: true,
        electronic_invoicing: true,
        multi_branch: true,
        export_pdf_excel: true,
        email_notifications: true
      } 
    },
    { 
      id: 'plan_profesional', 
      name: 'Profesional', 
      description: 'La solución completa para cadenas y grandes comercios.', 
      price_monthly: 25000, 
      max_branches: 9999, 
      max_users: 9999, 
      features: { 
        pos_terminal: true, 
        inventory: true, 
        barcode_scanner: true, 
        customers_credit: true, 
        reports_bi: true,
        automated_accounting: true,
        electronic_invoicing: true,
        multi_branch: true,
        export_pdf_excel: true,
        ai_assistant: true,
        daily_backups: true,
        email_notifications: true,
        priority_support: true
      } 
    },
  ]

  const plans: PublicPlan[] = fetchedPlans && fetchedPlans.length > 0 ? fetchedPlans : mockPlans

  return (
    <section id="planes" className="py-32 px-4 bg-white dark:bg-gray-950 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white">Invertí en tu tranquilidad</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto font-medium leading-relaxed">
            Sin contratos de permanencia. Sin gastos de instalación. Cancelá cuando quieras con un solo clic.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
          {plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} isPopular={i === popularIndex} />
          ))}
        </div>
        
        <div className="mt-20 p-10 rounded-[3rem] bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-2 text-center md:text-left">
             <h4 className="text-xl font-black text-gray-900 dark:text-white">¿Tenés una cadena de más de 10 locales?</h4>
             <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">Ofrecemos planes corporativos a medida con soporte prioritario 24/7.</p>
           </div>
           <a href="mailto:ventas@kioskos.com" className="px-8 py-4 bg-white dark:bg-gray-800 text-indigo-600 font-black rounded-2xl border-2 border-indigo-100 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all shadow-sm">
             CONTACTAR A VENTAS
           </a>
        </div>
      </div>
    </section>
  )
}

// --- CTA Final ---
function CtaSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-indigo-900 via-indigo-600 to-violet-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
      <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto rotate-12">
          <Zap className="w-10 h-10 text-white fill-current" />
        </div>
        <h2 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight">
          Empezá a gestionar tu <br /> negocio como un profesional
        </h2>
        <p className="text-indigo-100 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
          No pierdas más tiempo ni dinero con anotaciones en papel. Unite a la plataforma líder para kioskos y despensas.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
          <a href="#planes" className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-white hover:bg-gray-50 text-indigo-600 font-black text-xl rounded-2xl transition-all shadow-2xl hover:-translate-y-1">
            CREAR MI CUENTA <ArrowRight className="w-6 h-6" />
          </a>
          <p className="text-indigo-200 font-bold text-sm italic uppercase tracking-widest">SIN TARJETA DE CRÉDITO</p>
        </div>
      </div>
    </section>
  )
}

// --- Footer ---
function Footer() {
  return (
    <footer className="py-20 px-4 bg-gray-950 text-white border-t border-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter">Kioskos & Despenzas</span>
            </div>
            <p className="text-gray-400 max-w-sm leading-relaxed font-medium">
              Llevando tecnología de punta a los comercios de barrio. Simplificamos tu día a día para que te enfoques en lo que importa: vender más.
            </p>
            <div className="flex items-center gap-4">
              {['Facebook', 'Instagram', 'WhatsApp'].map(social => (
                <a key={social} href="#" className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 transition-all text-gray-400 hover:text-white">
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-current rounded-sm opacity-20" />
                </a>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h5 className="font-black text-sm uppercase tracking-widest text-indigo-400">Producto</h5>
            <ul className="space-y-4 text-sm font-bold text-gray-500">
              <li><a href="#funciones" className="hover:text-white transition-colors">Funciones</a></li>
              <li><a href="#vistas" className="hover:text-white transition-colors">Galería</a></li>
              <li><a href="#planes" className="hover:text-white transition-colors">Precios</a></li>
              <li><Link to="/checkout" className="hover:text-white transition-colors">Comenzar</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h5 className="font-black text-sm uppercase tracking-widest text-indigo-400">Compañía</h5>
            <ul className="space-y-4 text-sm font-bold text-gray-500">
              <li><a href="mailto:hola@kioskos.com" className="hover:text-white transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Ayuda</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-10 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm font-bold text-gray-600">
            © {new Date().getFullYear()} Kioskos & Despenzas. Hecho con ❤️ en Argentina.
          </p>
          <div className="flex items-center gap-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Data_fiscal_argentina.png" alt="Data Fiscal" className="h-10 opacity-30 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-pointer" />
          </div>
        </div>
      </div>
    </footer>
  )
}

// --- Pagina principal ---
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
    <div className="bg-white dark:bg-gray-950 min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />
      <HeroSection />
      <ShowcaseSection />
      <FeaturesSection />
      <ReferralSection />
      <PricingSection plans={plans} />
      <CtaSection />
      <Footer />
    </div>
  )
}
