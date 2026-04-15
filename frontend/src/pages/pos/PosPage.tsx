import { useState, useEffect } from 'react'
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  X,
  Store,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import {
  useActiveRegister,
  useOpenRegister,
  useCreateSale,
  useCustomers,
} from '@hooks/useSales'
import { useCategories } from '@hooks/useInventory'
import { inventoryApi } from '@api/inventory.api'
import { useCartStore } from '@store/cart.store'
import { useBranchStore } from '@store/branch.store'
import type { Product } from '@api/inventory.types'
import type { PaymentMethod } from '@api/sales.types'
import type { Customer } from '@api/sales.types'

function OpenRegisterModal({ branchId }: { branchId: string }) {
  const [balance, setBalance] = useState('')
  const openRegister = useOpenRegister()

  const handleOpen = (e: React.FormEvent) => {
    e.preventDefault()
    if (!balance || isNaN(Number(balance))) return
    openRegister.mutate({ branchId, balance: Number(balance) })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in border border-border">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Abrir Turno de Caja</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Ingresa el monto de apertura (cambio inicial) para comenzar a registrar ventas
          </p>

          <form onSubmit={handleOpen} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Monto inicial en caja ($)
              </label>
              <input
                autoFocus
                type="number"
                step="0.01"
                min="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-lg font-semibold
                           focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-center"
                placeholder="0.00"
              />
            </div>
            <button
              type="submit"
              disabled={!balance || openRegister.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-base
                         hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {openRegister.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Abrir Caja'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function PaymentModal({
  onClose,
  total,
}: {
  onClose: () => void
  total: number
}) {
  const cart = useCartStore()
  const { data: customers = [] } = useCustomers()
  const createSale = useCreateSale()
  const { activeBranch } = useBranchStore()

  const handleConfirm = () => {
    if (!activeBranch) return
    createSale.mutate(
      {
        branch_id: activeBranch.id,
        customer_id: cart.customerId || undefined,
        payment_method: cart.paymentMethod,
        items: cart.items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.unitPrice,
        })),
      },
      {
        onSuccess: () => {
          cart.clearCart()
          onClose()
        },
      }
    )
  }

  const methods: { id: PaymentMethod; label: string; icon: any }[] = [
    { id: 'cash', label: 'Efectivo', icon: Banknote },
    { id: 'card', label: 'Tarjeta', icon: CreditCard },
    { id: 'transfer', label: 'Transferencia', icon: Smartphone },
    { id: 'credit_client', label: 'Fiado (Cliente)', icon: User },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border animate-fade-in flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-lg">Finalizar Venta</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total a cobrar</p>
            <p className="text-4xl font-extrabold text-primary">
              ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <label className="block text-sm font-medium text-foreground mb-3">Método de pago</label>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {methods.map((m) => {
              const Icon = m.icon
              const isSelected = cart.paymentMethod === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => cart.setPaymentMethod(m.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              )
            })}
          </div>

          {cart.paymentMethod === 'credit_client' && (
            <div className="mb-6 animate-fade-in">
              <label className="block text-sm font-medium text-foreground mb-2">Seleccionar Cliente</label>
              <select
                value={cart.customerId || ''}
                onChange={(e) => cart.setCustomer(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-medium
                           focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              >
                <option value="" disabled>-- Elige un cliente --</option>
                {customers.map((c: Customer) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={createSale.isPending || (cart.paymentMethod === 'credit_client' && !cart.customerId)}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg
                       hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {createSale.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Confirmar y Cobrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PosPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [productsCache, setProductsCache] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  const { activeBranch } = useBranchStore()
  const cart = useCartStore()

  // 1. Verificar registro abierto
  const { data: activeRegister, isLoading: loadingRegister } = useActiveRegister(activeBranch?.id || '')
  
  // 2. Traer categorías
  const { data: categories = [] } = useCategories()

  // 3. Manejo de búsqueda en tiempo real usando el endpoint rápido
  useEffect(() => {
    if (!searchQuery.trim()) {
      setProductsCache([])
      return
    }
    const timer = setTimeout(() => {
      setIsSearching(true)
      inventoryApi.quickSearch(searchQuery).then((res) => {
        setProductsCache(res)
        setIsSearching(false)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Lógica de agregar al carrito
  const handleAddToCart = (product: Product) => {
    // Buscar precio default
    const defaultPriceListEntry = product.prices?.find((p) => p.price_list?.is_default)
    const unitPrice = defaultPriceListEntry ? Number(defaultPriceListEntry.price) : 0

    if (unitPrice === 0) {
      // Idealmente mostrar un toast indicando que el producto no tiene precio
      return
    }

    cart.addItem({
      productId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice,
    })
    
    // Auto-limpiar la búsqueda para fluidez
    setSearchQuery('')
  }

  if (!activeBranch) {
    return <div className="h-full flex items-center justify-center p-8 text-center text-muted-foreground">Configura una sucursal activa para usar el POS.</div>
  }

  if (loadingRegister) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  if (!activeRegister) {
    return <OpenRegisterModal branchId={activeBranch.id} />
  }

  return (
    <div className="h-full flex bg-muted/20">
      {/* LADO IZQUIERDO: PRODUCTOS Y BÚSQUEDA */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        {/* Topbar interno */}
        <div className="bg-card p-4 border-b border-border shadow-sm z-10">
          <div className="relative max-w-2xl mx-auto">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${searchQuery ? 'text-primary' : 'text-muted-foreground'}`} />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código de barras o nombre..."
              className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl text-lg
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
            )}
            {searchQuery && !isSearching && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-muted hover:bg-muted-foreground/20 rounded-full text-muted-foreground transition-colors"
                tabIndex={-1}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categorías (Quick filters) */}
          <div className="flex gap-2 overflow-x-auto mt-4 pb-1 no-scrollbar max-w-2xl mx-auto">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                ${!activeCategory ? 'bg-primary text-primary-foreground shadow-md' : 'bg-background border border-border text-foreground hover:bg-accent'}`}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                  ${activeCategory === c.id ? 'bg-primary text-primary-foreground shadow-md' : 'bg-background border border-border text-foreground hover:bg-accent'}`}
                style={activeCategory === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
          <div className="max-w-7xl mx-auto">
            {searchQuery && productsCache.length === 0 && !isSearching ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground mt-10">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No se encontraron productos</p>
                <p className="text-sm mt-1">Intenta con otro término o lee un código de barras nuevamente.</p>
              </div>
            ) : null}

            {/* Render results or placeholder */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {productsCache.map((product) => {
                const defaultPrice = product.prices?.find((p) => p.price_list?.is_default)
                const price = defaultPrice ? Number(defaultPrice.price) : 0
                return (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className="flex flex-col text-left bg-card border border-border hover:border-primary/50 hover:shadow-md 
                               rounded-2xl p-4 transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-primary h-full"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 flex-shrink-0">
                      {product.category?.icon ? <span className="font-bold text-xl">{product.category.name.charAt(0)}</span> : <Store className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-h-0">
                      <p className="font-semibold text-foreground text-sm line-clamp-2 leading-snug mb-1">{product.name}</p>
                      <p className="text-xs text-muted-foreground mb-3">{product.barcode || product.internal_code || 'Sin código'}</p>
                    </div>
                    <div className="w-full flex items-center justify-between mt-auto pt-2 border-t border-border group-hover:border-primary/20 transition-colors">
                      <span className="font-extrabold text-primary text-lg">${price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            
            {!searchQuery && (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground mt-20 opacity-40">
                <ShoppingCart className="w-16 h-16 mb-4" />
                <p className="text-xl font-medium">Usa la barra superior para buscar productos</p>
                <p className="text-sm mt-2">Puedes pistolear códigos de barras en cualquier momento.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LADO DERECHO: TICKET / CARRITO */}
      <div className="w-full max-w-sm lg:max-w-md bg-card flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.05)] z-20">
        <div className="p-4 border-b border-border bg-slate-900 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Ticket Actual
          </h2>
          <span className="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full font-bold">
            {cart.itemCount} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/10 p-3 no-scrollbar space-y-2">
          {cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-6">
              <ShoppingCart className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">El carrito está vacío</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.productId} className="bg-card border border-border rounded-xl p-3 flex gap-3 shadow-sm animate-fade-in group">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })} un.
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="font-bold text-foreground">
                    ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                  
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 border border-border opacity-60 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1 hover:bg-background rounded-md transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-semibold w-6 text-center select-none">{item.quantity}</span>
                    <button 
                      onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1 hover:bg-background rounded-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumen Totales */}
        <div className="border-t border-border bg-card p-4 flex-shrink-0 pb-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Total a pagar</span>
            <span className="text-3xl font-extrabold text-primary">
              ${cart.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => cart.clearCart()}
              disabled={cart.items.length === 0}
              className="px-4 py-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 
                         disabled:opacity-40 transition-colors flex items-center justify-center shrink-0 border border-destructive/20"
              title="Vaciar carrito"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.items.length === 0}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold text-lg
                         hover:bg-primary/90 disabled:opacity-40 transition-all flex justify-center items-center gap-2 shadow-lg hover:shadow-xl shadow-primary/25"
            >
              <CreditCard className="w-5 h-5" />
              Cobrar
            </button>
          </div>
        </div>
      </div>

      {showPayment && <PaymentModal total={cart.total} onClose={() => setShowPayment(false)} />}
    </div>
  )
}
