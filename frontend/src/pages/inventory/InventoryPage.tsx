import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { 
  Package, BarChart3, Tag, Landmark, Award, 
  LayoutGrid, List, ChevronRight, ArrowLeft 
} from 'lucide-react'
import ProductsPage from './ProductsPage'
import StockPage from './StockPage'
import CategoriesPage from './CategoriesPage'
import MassivePricingPage from './MassivePricingPage'
import BrandsPage from './BrandsPage'

const inventoryTools = [
  { 
    id: 'products',
    to: '/inventory/products', 
    label: 'Productos', 
    description: 'Catálogo completo, precios y gestión de artículos',
    icon: Package, 
    color: 'bg-blue-500' 
  },
  { 
    id: 'stock',
    to: '/inventory/stock', 
    label: 'Stock', 
    description: 'Existencias por sucursal y mermas',
    icon: BarChart3, 
    color: 'bg-emerald-500' 
  },
  { 
    id: 'categories',
    to: '/inventory/categories', 
    label: 'Categorías', 
    description: 'Organización del catálogo por rubros',
    icon: Tag, 
    color: 'bg-pink-500' 
  },
  { 
    id: 'brands',
    to: '/inventory/brands', 
    label: 'Marcas', 
    description: 'Gestión de fabricantes y marcas registradas',
    icon: Award, 
    color: 'bg-purple-500' 
  },
  { 
    id: 'pricing',
    to: '/inventory/pricing', 
    label: 'Gestión de Precios', 
    description: 'Aumentos masivos y actualización selectiva',
    icon: Landmark, 
    color: 'bg-amber-500' 
  },
]

export default function InventoryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const isHub = location.pathname === '/inventory' || location.pathname === '/inventory/'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Dinámico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {!isHub && (
              <button 
                onClick={() => navigate('/inventory')}
                className="p-2 hover:bg-accent rounded-xl transition-colors group"
                title="Volver al menú de inventario"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1 ml-1">
            {isHub ? 'Centro de herramientas de gestión de productos' : inventoryTools.find(t => location.pathname.startsWith(t.to))?.label}
          </p>
        </div>

        {isHub && (
          <div className="flex bg-muted p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Contenido Principal */}
      <div className="animate-fade-in">
        {isHub ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "flex flex-col gap-3"
          }>
            {inventoryTools.map((tool) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  onClick={() => navigate(tool.to)}
                  className={`group relative text-left transition-all duration-300 ${
                    viewMode === 'grid'
                      ? "p-6 bg-card border border-border rounded-3xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 min-h-[160px] flex flex-col justify-between"
                      : "p-4 bg-card border border-border rounded-xl hover:bg-accent flex items-center justify-between"
                  }`}
                >
                  <div className={`flex items-center gap-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${tool.color} transition-transform group-hover:scale-110`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{tool.label}</h3>
                      <p className={`text-sm text-muted-foreground line-clamp-1 ${viewMode === 'grid' ? 'mt-1' : 'hidden sm:block'}`}>
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  
                  {viewMode === 'grid' ? (
                    <div className="flex justify-end pt-4">
                      <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-primary group-hover:border-primary transition-all">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <Routes>
            <Route path="products" element={<ProductsPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="pricing" element={<MassivePricingPage />} />
          </Routes>
        )}
      </div>
    </div>
  )
}
