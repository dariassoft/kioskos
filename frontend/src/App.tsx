import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@store/auth.store'

// Layouts
import AdminLayout from '@layouts/AdminLayout'
import PosLayout from '@layouts/PosLayout'
import AuthLayout from '@layouts/AuthLayout'
import SuperAdminLayout from '@layouts/SuperAdminLayout'

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

// Sales - POS (Fase 3)
import PosPage from '@pages/pos/PosPage'

// SuperAdmin
import SuperAdminDashboard from '@pages/superadmin/SuperAdminDashboard'
import TenantsPage from '@pages/superadmin/TenantsPage'

// Rutas protegidas
function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
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
        {/* Raíz → redirigir según autenticación */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ====================================
            AUTH (público)
           ==================================== */}
        <Route element={<AuthLayout />}>
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
          {/* Fases 5 */}
          {/* <Route path="/reports/*" element={<ReportsPage />} /> */}
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
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
