import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@store/auth.store'
import { useEffect, useState } from 'react'
import { usePwaStore } from '@store/pwa.store'
import { Download, X } from 'lucide-react'

// Layouts
import AdminLayout from '@layouts/AdminLayout'
import PosLayout from '@layouts/PosLayout'
import AuthLayout from '@layouts/AuthLayout'
import SuperAdminLayout from '@layouts/SuperAdminLayout'

// Páginas públicas
import LandingPage from '@pages/LandingPage'
import CheckoutPage from '@pages/checkout/CheckoutPage'
import PaymentSuccessPage from '@pages/checkout/PaymentSuccessPage'
import { PaymentPendingPage, PaymentFailurePage } from '@pages/checkout/PaymentResultPages'

// Auth
import LoginPage from '@pages/auth/LoginPage'
import RegisterPage from '@pages/auth/RegisterPage'

// Dashboard
import DashboardPage from '@pages/DashboardPage'

// Inventory (Fase 2)
import InventoryPage from '@pages/inventory/InventoryPage'

import CustomersPage from '@pages/customers/CustomersPage'
import CurrentAccountsPage from '@pages/current-accounts/CurrentAccountsPage'

// Purchases & Accounting (Fase 4)
import PurchasesPage from '@pages/purchases/PurchasesPage'
import AccountingPage from '@pages/accounting/AccountingPage'

// Settings (Fase 7)
import SettingsPage from '@pages/settings/SettingsPage'

// ARCA Electronic Invoicing (Fase 9)
import AfipInvoicesPage from '@pages/afip/AfipInvoicesPage'

// Expenses (Gastos)
import ExpensesPage from '@pages/expenses/ExpensesPage'

// Production (Fase 14)
import ProductionPage from '@pages/production/ProductionPage'

// Sales - POS (Fase 3)
import PosPage from '@pages/pos/PosPage'

// SuperAdmin
import SuperAdminDashboard from '@pages/superadmin/SuperAdminDashboard'
import TenantsPage from '@pages/superadmin/TenantsPage'
import BillingPage from '@pages/superadmin/BillingPage'
import SubscriptionsPage from '@pages/superadmin/SubscriptionsPage'
import PlansPage from '@pages/superadmin/PlansPage'
import PendingPaymentsPage from '@pages/superadmin/PendingPaymentsPage'
import SuperAdminSettingsPage from '@pages/superadmin/SettingsPage'
import PromotionsPage from '@pages/superadmin/PromotionsPage'
import UpcomingChargesPage from '@pages/superadmin/UpcomingChargesPage'

// Rutas protegidas
function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === 'superadmin' ? '/superadmin' : user.role === 'cashier' ? '/pos' : '/dashboard'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}

export default function App() {
  const { setDeferredPrompt, setIsInstalled, isInstallable, isInstalled, deferredPrompt } = usePwaStore()
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    // Detectar si ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    // @ts-ignore (Safari support)
    const isStandaloneSafari = window.navigator.standalone === true
    
    if (isStandalone || isStandaloneSafari) {
      setIsInstalled(true)
    }

    const handler = (e: any) => {
      // Ya NO llamamos a e.preventDefault() para permitir el banner nativo
      setDeferredPrompt(e)
      console.log('✅ PWA: beforeinstallprompt capturado (nativo habilitado)')
    }

    const appInstalledHandler = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
      console.log('✅ PWA: App instalada exitosamente')
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', appInstalledHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', appInstalledHandler)
    }
  }, [setDeferredPrompt, setIsInstalled])

  useEffect(() => {
    if (isInstallable && !isInstalled) {
      // Mostrar el toast tras 5 segundos de navegación
      const timer = setTimeout(() => setShowToast(true), 5000)
      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await (deferredPrompt as any).prompt()
    const { outcome } = await (deferredPrompt as any).userChoice
    if (outcome === 'accepted') {
      setShowToast(false)
      setDeferredPrompt(null)
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ====================================
            LANDING PAGE (raíz pública)
           ==================================== */}
        <Route path="/" element={<LandingPage />} />

        {/* ====================================
            CHECKOUT — flujo de suscripción
           ==================================== */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<PaymentSuccessPage />} />
        <Route path="/checkout/pending" element={<PaymentPendingPage />} />
        <Route path="/checkout/failure" element={<PaymentFailurePage />} />

        {/* ====================================
            AUTH (público) — login en /login
           ==================================== */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
        </Route>

        {/* ====================================
            ADMIN — Panel de gestión
           ==================================== */}
        <Route
          element={
            <PrivateRoute roles={['admin', 'manager']}>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory/*" element={<InventoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/current-accounts" element={<CurrentAccountsPage />} />
          <Route path="/purchases/*" element={<PurchasesPage />} />
          <Route path="/accounting/*" element={<AccountingPage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
          <Route path="/afip/invoices" element={<AfipInvoicesPage />} />
          <Route path="/expenses/*" element={<ExpensesPage />} />
          <Route path="/production/*" element={<ProductionPage />} />
        </Route>

        {/* ====================================
            POS — Terminal de venta
           ==================================== */}
        <Route
          path="/pos"
          element={
            <PrivateRoute roles={['cashier', 'admin', 'manager', 'superadmin']}>
              <PosLayout>
                <PosPage />
              </PosLayout>
            </PrivateRoute>
          }
        />

        {/* ====================================
            SUPERADMIN — Panel del dueño
           ==================================== */}
        <Route
          element={
            <PrivateRoute roles={['superadmin']}>
              <SuperAdminLayout />
            </PrivateRoute>
          }
        >
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/tenants" element={<TenantsPage />} />
          <Route path="/superadmin/billing" element={<BillingPage />} />
          <Route path="/superadmin/pending-payments" element={<PendingPaymentsPage />} />
          <Route path="/superadmin/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/superadmin/plans" element={<PlansPage />} />
          <Route path="/superadmin/promotions" element={<PromotionsPage />} />
          <Route path="/superadmin/upcoming-charges" element={<UpcomingChargesPage />} />
          <Route path="/superadmin/settings" element={<SuperAdminSettingsPage />} />
        </Route>

        {/* 404 Fallback → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* PWA Install Alert (Toast) */}
      {showToast && isInstallable && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl shadow-indigo-500/40 flex items-center gap-4 border border-indigo-400/50">
            <div className="bg-white/20 p-2 rounded-xl">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">¿Instalar Kioskos & Despenzas?</p>
              <p className="text-xs text-indigo-100 italic">Disfruta de una experiencia más rápida y pantalla completa.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleInstall}
                className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-extrabold hover:bg-indigo-50 transition-colors shadow-sm"
              >
                INSTALAR
              </button>
              <button 
                onClick={() => setShowToast(false)}
                className="text-white/60 hover:text-white flex justify-center py-1"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </BrowserRouter>
  )
}
