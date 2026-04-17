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
  LayoutGrid,
  List,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react'
import {
  useActiveRegister,
  useOpenRegister,
  useCreateSale,
  useCustomers,
  usePaymentAccounts,
  useUploadVoucher,
  useVerifySalePayment,
} from '@hooks/useSales'
import { useCategories, useBranches } from '@hooks/useInventory'
import { inventoryApi } from '@api/inventory.api'
import { useCartStore } from '@store/cart.store'
import { useBranchStore } from '@store/branch.store' 
import toast from 'react-hot-toast'
import type { Product, Category } from '@api/inventory.types'
import type { PaymentMethod, PaymentStatus, SaleStatus, CreateSaleDto, Customer } from '@api/sales.types'

function OpenRegisterModal({ branchId }: { branchId: string }) {
  const [balance, setBalance] = useState('')
  const openRegister = useOpenRegister()

  const { activeBranch } = useBranchStore()
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
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <Store className="w-3.5 h-3.5" />
            {activeBranch?.name || 'Sucursal desconocida'}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
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

  const [mpPaymentId, setMpPaymentId] = useState('')
  const [mpPaymentStatus, setMpPaymentStatus] = useState<'approved' | 'pending' | 'rejected'>('approved')
  const [payerName, setPayerName] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [transferOrigin, setTransferOrigin] = useState('')
  const [transferVoucher, setTransferVoucher] = useState('')
  const [cardLastDigits, setCardLastDigits] = useState('')
  const [cardBrand, setCardBrand] = useState('')
  const [authorizationCode, setAuthorizationCode] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Nuevos estados para transferencia
  const { data: accounts } = usePaymentAccounts()
  const uploadVoucher = useUploadVoucher()
  const verifyPayment = useVerifySalePayment()
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [voucherFile, setVoucherFile] = useState<File | null>(null)
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVoucherFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setVoucherPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleConfirm = () => {
    if (!activeBranch) return

    const paymentStatus: PaymentStatus =
      cart.paymentMethod === 'cash' ||
      cart.paymentMethod === 'debit_card' ||
      cart.paymentMethod === 'credit_card' ||
      cart.paymentMethod === 'credit_client'
        ? 'confirmed'
        : mpPaymentStatus === 'approved'
          ? 'confirmed'
          : 'pending'

    const payload: CreateSaleDto = {
      branch_id: activeBranch.id,
      customer_id: cart.customerId || undefined,
      payment_method: cart.paymentMethod,
      payment_status: paymentStatus,
      payment_details: {
        mp_payment_id: mpPaymentId || undefined,
        mp_payment_status: cart.paymentMethod === 'qr_mercadopago' || cart.paymentMethod === 'link_mercadopago' ? mpPaymentStatus : undefined,
        payer_name: payerName || undefined,
        payer_email: payerEmail || undefined,
        transfer_origin: transferOrigin || undefined,
        transfer_voucher: transferVoucher || undefined,
        card_last_digits: cardLastDigits || undefined,
        card_brand: cardBrand || undefined,
        authorization_code: authorizationCode || undefined,
        payment_notes: paymentNotes || undefined,
      },
      items: cart.items.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
        unit_price: i.unitPrice,
      })),
    }

    createSale.mutate(payload, {
      onSuccess: async (sale) => {
        // Si hay archivo de comprobante, lo subimos
        if (voucherFile) {
          await uploadVoucher.mutateAsync({ saleId: sale.id, file: voucherFile })
        }
        
        // El usuario pidió que el cajero lo marque como pagado manualmente.
        // En este flujo, al subir el comprobante y finalizar, lo confirmamos.
        if (cart.paymentMethod === 'transfer' && voucherFile) {
           await verifyPayment.mutateAsync(sale.id)
        }

        cart.clearCart()
        onClose()
      },
    })
  }

  const methods: { id: PaymentMethod; label: string; icon: LucideIcon }[] = [
    { id: 'cash', label: 'Efectivo', icon: Banknote },
    { id: 'debit_card', label: 'Tarjeta Débito', icon: CreditCard },
    { id: 'credit_card', label: 'Tarjeta Crédito', icon: CreditCard },
    { id: 'transfer', label: 'Transferencia', icon: Smartphone },
    { id: 'qr_mercadopago', label: 'QR MercadoPago', icon: Smartphone },
    { id: 'link_mercadopago', label: 'Link MercadoPago', icon: Smartphone },
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

        <div className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          <div className="text-center mb-2">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total a cobrar</p>
            <p className="text-4xl font-extrabold text-primary">
              ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <label className="block text-sm font-medium text-foreground mb-3">Método de pago</label>
          <div className="grid grid-cols-2 gap-3">
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
                  <div className="w-6 h-6 mb-2 flex items-center justify-center">
                    <Icon />
                  </div>
                  <span className="text-xs font-medium text-center">{m.label}</span>
                </button>
              )
            })}
          </div>

          {cart.paymentMethod === 'credit_client' && (
            <div>
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

          {(cart.paymentMethod === 'transfer' || cart.paymentMethod === 'qr_mercadopago' || cart.paymentMethod === 'link_mercadopago') && (
            <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del pagador</label>
                <input className="input-field" value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="Juan Pérez / Cliente" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email del pagador</label>
                <input className="input-field" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} placeholder="cliente@email.com" />
              </div>
              {cart.paymentMethod === 'transfer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-primary">Cuenta de destino</label>
                    <div className="grid grid-cols-1 gap-2">
                       {accounts?.filter(a => a.is_active).map(acc => (
                         <button
                           key={acc.id}
                           type="button"
                           onClick={() => {
                             setSelectedAccountId(acc.id)
                             setTransferVoucher(`${acc.name}: ${acc.value}`)
                           }}
                           className={`p-3 rounded-xl border text-left transition-all ${
                             selectedAccountId === acc.id 
                               ? 'bg-primary/10 border-primary ring-1 ring-primary' 
                               : 'bg-background border-border hover:border-primary/50'
                           }`}
                         >
                           <p className="font-bold text-sm">{acc.name}</p>
                           <p className="text-[10px] font-mono opacity-70">{acc.type.toUpperCase()}: {acc.value}</p>
                         </button>
                       ))}
                       {(!accounts || accounts.length === 0) && (
                         <p className="text-[10px] text-muted-foreground italic">No hay cuentas configuradas en ajustes.</p>
                       )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Comprobante de transferencia</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 h-16 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors"
                        onClick={() => document.getElementById('cameraInput')?.click()}
                      >
                        <Camera className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Cámara</span>
                      </button>
                      <button
                        type="button"
                        className="flex-1 h-16 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors"
                        onClick={() => document.getElementById('fileInput')?.click()}
                      >
                        <ImageIcon className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Galería</span>
                      </button>
                      <input id="cameraInput" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                      <input id="fileInput" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>
                    {voucherPreview && (
                      <div className="mt-2 relative group">
                        <img src={voucherPreview} alt="Comprobante" className="w-full h-32 object-cover rounded-xl border border-border" />
                        <button 
                          onClick={() => { setVoucherFile(null); setVoucherPreview(null); }}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Capturado
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Referencia adicional (opcional)</label>
                    <input className="input-field" value={transferVoucher} onChange={(e) => setTransferVoucher(e.target.value)} placeholder="Nro de operación" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Billetera / Banco origen</label>
                    <input className="input-field" value={transferOrigin} onChange={(e) => setTransferOrigin(e.target.value)} placeholder="Mercado Pago / Ualá / Banco Nación" />
                  </div>
                </>
              )}
              {(cart.paymentMethod === 'qr_mercadopago' || cart.paymentMethod === 'link_mercadopago') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">ID de pago / referencia MP</label>
                    <input className="input-field" value={mpPaymentId} onChange={(e) => setMpPaymentId(e.target.value)} placeholder="1234567890" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado del pago</label>
                    <select className="input-field" value={mpPaymentStatus} onChange={(e) => setMpPaymentStatus(e.target.value as 'approved' | 'pending' | 'rejected')}>
                      <option value="approved">Aprobado</option>
                      <option value="pending">Pendiente</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {(cart.paymentMethod === 'debit_card' || cart.paymentMethod === 'credit_card') && (
            <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Marca</label>
                  <input className="input-field" value={cardBrand} onChange={(e) => setCardBrand(e.target.value)} placeholder="Visa / Mastercard" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Últimos 4 dígitos</label>
                  <input className="input-field" value={cardLastDigits} onChange={(e) => setCardLastDigits(e.target.value)} maxLength={4} placeholder="1234" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Código de autorización</label>
                <input className="input-field" value={authorizationCode} onChange={(e) => setAuthorizationCode(e.target.value)} placeholder="AUTH123" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Notas del pago</label>
            <textarea className="input-field" rows={3} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Datos adicionales, observaciones o reclamos" />
          </div>

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
  const [showCartMobile, setShowCartMobile] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('pos_view_mode') as 'grid' | 'list') || 'grid'
  })

  // Persistir la preferencia de vista
  useEffect(() => {
    localStorage.setItem('pos_view_mode', viewMode)
  }, [viewMode])

  const { activeBranch } = useBranchStore()
  const cart = useCartStore()

  // Garantiza que las sucursales estén cargadas (auto-selecciona la principal)
  const { isLoading: loadingBranches } = useBranches()

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
      inventoryApi.quickSearch(searchQuery, activeBranch?.id).then((res) => {
        setProductsCache(res)
        setIsSearching(false)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, activeBranch?.id])

  // Lógica de agregar al carrito
  const handleAddToCart = (product: Product) => {
    // Buscar precio: intentar default, si no, el primero disponible
    const defaultPriceListEntry = product.prices?.find((p) => p.price_list?.is_default)
    const firstAvailablePrice = product.prices?.[0]
    
    const priceEntry = defaultPriceListEntry || firstAvailablePrice
    const unitPrice = priceEntry ? Number(priceEntry.price) : 0

    if (unitPrice === 0) {
      toast.error(`El producto "${product.name}" no tiene un precio configurado.`)
      return
    }

    // Obtener stock disponible de la relación 'inventory' mapeada por branchId
    const stockAvailable = product.inventory ? Number(product.inventory.stock_quantity) : 0;

    if (stockAvailable <= 0) {
      toast.error(`Sin stock disponible en esta sucursal.`)
      return;
    }

    cart.addItem({
      productId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice,
      stockLimit: stockAvailable
    })

    toast.success(`Agregado: ${product.name}`, { position: 'bottom-center' })
    setSearchQuery('')
  }

  // Mientras se cargan las sucursales mostrar spinner en lugar del mensaje de error
  if (loadingBranches && !activeBranch) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  if (!activeBranch) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-4">
        <Store className="w-12 h-12 opacity-30" />
        <div>
          <p className="font-semibold text-foreground">Sin sucursal activa</p>
          <p className="text-sm mt-1">Ve a <strong>Configuración → Sucursales</strong> para crear y activar una sucursal.</p>
        </div>
      </div>
    )
  }

  if (loadingRegister) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  if (!activeRegister) {
    return <OpenRegisterModal branchId={activeBranch.id} />
  }

  return (
    <div className="h-full flex flex-col md:flex-row bg-muted/20 relative overflow-hidden">
      {/* LADO IZQUIERDO: PRODUCTOS Y BÚSQUEDA */}
      <div className="flex-1 flex flex-col min-w-0 md:border-r border-border h-full overflow-hidden">
        {/* Topbar interno */}
        <div className="bg-card p-4 border-b border-border shadow-sm z-10 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            {/* Indicador/Selector de Sucursal */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Sucursal Activa</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">{activeBranch.name}</span>
                  <select 
                    value={activeBranch.id}
                    onChange={(e) => {
                      const selected = useBranchStore.getState().branches.find(b => b.id === e.target.value);
                      if (selected) useBranchStore.getState().setActiveBranch(selected);
                    }}
                    className="bg-transparent text-[10px] h-6 px-1 border border-border rounded hover:border-primary transition-colors cursor-pointer"
                  >
                    {useBranchStore.getState().branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="relative flex-1 w-full max-w-md">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${searchQuery ? 'text-primary' : 'text-muted-foreground'}`} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código de barras o nombre..."
                className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-md
                           shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
              )}
            </div>
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
            {categories.map((c: Category) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                  ${activeCategory === c.id ? 'bg-primary text-primary-foreground shadow-md' : 'bg-background border border-border text-foreground hover:bg-accent'}`}
                style={activeCategory === c.id && c.color ? { backgroundColor: c.color, borderColor: c.color } : {}}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* View mode toggle + Stats */}
        <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border">
            <button
               onClick={() => setViewMode('grid')}
               className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
               title="Vista de grilla"
            >
               <LayoutGrid className="w-4 h-4" />
            </button>
            <button
               onClick={() => setViewMode('list')}
               className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
               title="Vista de lista"
            >
               <List className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {productsCache.length} productos {searchQuery ? 'encontrados' : 'sugeridos'}
          </p>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-28 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {searchQuery && productsCache.length === 0 && !isSearching ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground mt-10">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No se encontraron productos</p>
                <p className="text-sm mt-1">Intenta con otro término o lee un código de barras nuevamente.</p>
              </div>
            ) : null}

            {/* Render results or placeholder */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {productsCache.map((product) => {
                  const defaultPrice = product.prices?.find((p) => p.price_list?.is_default)
                  const price = defaultPrice ? Number(defaultPrice.price) : 0
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleAddToCart(product)}
                      className="flex flex-col text-left bg-card border border-border hover:border-primary/50 hover:shadow-md
                                 rounded-2xl overflow-hidden transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-primary h-full"
                    >
                      <div className="aspect-square w-full bg-muted relative overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${product.image_url}`}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                            {product.category?.name ? (
                              <span className="font-black text-4xl uppercase opacity-10">{product.category.name.charAt(0)}</span>
                            ) : (
                              <Store className="w-12 h-12 opacity-10" />
                            )}
                          </div>
                        )}
                        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                           <Plus className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="font-bold text-foreground text-xs md:text-sm line-clamp-2 leading-tight uppercase flex-1">{product.name}</p>
                          {(() => {
                            const stock = product.inventory ? Number(product.inventory.stock_quantity) : 0;
                            return (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded leading-none whitespace-nowrap ${stock > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                                {stock > 0 ? `STOCK: ${stock}` : 'SIN STOCK'}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mb-2">{product.barcode || product.internal_code || 'Sin código'}</p>
                        <div className="mt-auto pt-2 border-t border-border flex items-baseline gap-1">
                          <span className="text-primary font-black text-base md:text-lg">${price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                          {product.unit && <span className="text-[10px] text-muted-foreground">/ {product.unit.abbreviation}</span>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {productsCache.map((product) => {
                  const defaultPrice = product.prices?.find((p) => p.price_list?.is_default)
                  const price = defaultPrice ? Number(defaultPrice.price) : 0
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleAddToCart(product)}
                      className="flex items-center gap-3 p-3 bg-card border border-border hover:border-primary/50 rounded-xl transition-all active:scale-[0.98] group text-left"
                    >
                      <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden border border-border/50">
                        {product.image_url ? (
                          <img src={`${import.meta.env.VITE_API_URL}${product.image_url}`} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-black">
                            {product.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] font-medium px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                              {product.barcode || product.internal_code || 'SC'}
                           </span>
                           {product.category && (
                             <span className="text-[10px] font-medium" style={{ color: product.category.color }}>
                                {product.category.name}
                             </span>
                           )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        <span className="text-primary font-black text-lg">${price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                        {(() => {
                          const stock = product.inventory ? Number(product.inventory.stock_quantity) : 0;
                          return (
                             <div className="flex flex-col items-end">
                                <span className={`text-[9px] font-bold ${stock > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                                   ST: {stock} {product.unit?.abbreviation || 'un'}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                                   <Plus className="w-3 h-3" /> AGREGAR
                                </div>
                             </div>
                          );
                        })()}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

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

      {/* LADO DERECHO: TICKET / CARRITO (Escritorio) */}
      <div className="hidden md:flex w-full max-w-sm lg:max-w-md bg-card flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.05)] z-20">
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
                      onClick={() => {
                        if (item.quantity + 1 > (item.stockLimit ?? Infinity)) {
                          toast.error('Límite de stock alcanzado', { id: `limit-${item.productId}` });
                        }
                        cart.updateQuantity(item.productId, item.quantity + 1);
                      }}
                      className={`p-1 rounded-md transition-colors ${item.quantity >= (item.stockLimit ?? Infinity) ? 'text-muted-foreground bg-muted cursor-not-allowed' : 'hover:bg-background'}`}
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

      {/* TICKET MÓVIL (Drawer) */}
      {showCartMobile && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-300">
          <div 
            className="absolute inset-x-0 bottom-0 top-10 bg-card rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-bold text-lg">Ticket Actual</h2>
              </div>
              <button 
                onClick={() => setShowCartMobile(false)}
                className="p-2 bg-muted rounded-full hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
              {cart.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p>Carrito vacío</p>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.productId} className="bg-card border border-border rounded-2xl p-4 flex gap-4 shadow-sm h-24">
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="font-bold text-base text-foreground truncate">{item.name}</p>
                      <p className="text-sm text-primary font-bold mt-1">
                        ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-muted rounded-xl p-1 px-2">
                       <button onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)} className="p-2"><Minus className="w-4 h-4" /></button>
                       <span className="font-bold w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => {
                            if (item.quantity + 1 > (item.stockLimit ?? Infinity)) {
                              toast.error('Límite de stock alcanzado', { id: `limit-mb-${item.productId}` });
                            }
                            cart.updateQuantity(item.productId, item.quantity + 1);
                          }}
                          className={`p-2 ${item.quantity >= (item.stockLimit ?? Infinity) ? 'text-muted-foreground' : ''}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-border bg-card shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
               <div className="flex justify-between items-center mb-6">
                 <span className="text-sm font-bold text-muted-foreground uppercase">Total cobrar</span>
                 <span className="text-3xl font-black text-primary">
                    ${cart.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                 </span>
               </div>
               <div className="flex gap-3">
                 <button 
                   onClick={() => { cart.clearCart(); setShowCartMobile(false); }}
                   className="p-4 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20"
                 >
                   <Trash2 className="w-6 h-6" />
                 </button>
                 <button 
                   onClick={() => { setShowCartMobile(false); setShowPayment(true); }}
                   className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xl shadow-lg shadow-primary/30"
                 >
                   COBRAR AHORA
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE MÓVIL (FAB) */}
      {!showCartMobile && cart.items.length > 0 && (
        <button
          onClick={() => setShowCartMobile(true)}
          className="md:hidden fixed bottom-20 left-4 right-4 z-50 bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(79,70,229,0.4)] flex items-center justify-between animate-in slide-in-from-bottom-10 duration-500 overflow-hidden"
        >
          <div className="flex items-center gap-3">
             <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-white text-indigo-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-indigo-600">
                  {cart.itemCount}
                </span>
             </div>
             <div>
                <p className="text-[10px] uppercase font-black opacity-80 leading-none mb-1">Ver mi ticket</p>
                <p className="text-lg font-black leading-none">${cart.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</p>
             </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl font-black text-xs">
             Siguiente <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      )}

      {showPayment && <PaymentModal total={cart.total} onClose={() => setShowPayment(false)} />}
    </div>
  )
}
