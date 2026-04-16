import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@store/auth.store'

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

// Purchases & Accounting (Fase 4)
import PurchasesPage from '@pages/purchases/PurchasesPage'
import AccountingPage from '@pages/accounting/AccountingPage'

// Settings (Fase 7)
import SettingsPage from '@pages/settings/SettingsPage'

// ARCA Electronic Invoicing (Fase 9)
import AfipInvoicesPage from '@pages/afip/AfipInvoicesPage'

// Sales - POS (Fase 3)
import PosPage from '@pages/pos/PosPage'

// SuperAdmin
import SuperAdminDashboard from '@pages/superadmin/SuperAdminDashboard'
import TenantsPage from '@pages/superadmin/TenantsPage'
import BillingPage from '@pages/superadmin/BillingPage'
import SubscriptionsPage from '@pages/superadmin/SubscriptionsPage'
import PlansPage from '@pages/superadmin/PlansPage'
import PendingPaymentsPage from '@pages/superadmin/PendingPaymentsPage'

// Rutas protegidas
function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default function App() {
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
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory/*" element={<InventoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/purchases/*" element={<PurchasesPage />} />
          <Route path="/accounting/*" element={<AccountingPage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
          <Route path="/afip/invoices" element={<AfipInvoicesPage />} />
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
        </Route>

        {/* 404 Fallback → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
