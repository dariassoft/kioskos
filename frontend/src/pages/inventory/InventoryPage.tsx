import { Routes, Route, NavLink } from 'react-router-dom'
import { Package, BarChart3, Tag } from 'lucide-react'
import ProductsPage from './ProductsPage'
import StockPage from './StockPage'
import CategoriesPage from './CategoriesPage'

const tabs = [
  { to: '/inventory', label: 'Productos', icon: Package, end: true },
  { to: '/inventory/stock', label: 'Stock', icon: BarChart3 },
  { to: '/inventory/categories', label: 'Categorías', icon: Tag },
]

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestión de productos, stock por sucursal y listas de precios
        </p>
      </div>

      {/* Sub-navegación */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Contenido según sub-ruta */}
      <Routes>
        <Route index element={<ProductsPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="categories" element={<CategoriesPage />} />
      </Routes>
    </div>
  )
}
