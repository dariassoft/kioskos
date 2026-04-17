import { create } from 'zustand'

export interface CartItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  stockLimit?: number
}

export type PaymentMethod =
  | 'cash'
  | 'debit_card'
  | 'credit_card'
  | 'transfer'
  | 'qr_mercadopago'
  | 'link_mercadopago'
  | 'credit_client'

interface CartState {
  items: CartItem[]
  paymentMethod: PaymentMethod
  customerId: string | null
  discount: number

  // Getters computados
  total: number
  itemCount: number

  // Acciones
  addItem: (item: Omit<CartItem, 'subtotal'>) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setCustomer: (customerId: string | null) => void
  setDiscount: (amount: number) => void
  clearCart: () => void
}

/**
 * Store del carrito del POS.
 * No se persiste — el carrito se limpia al cerrar o completar la venta.
 */
export const useCartStore = create<CartState>()((set, _get) => ({
  items: [],
  paymentMethod: 'cash',
  customerId: null,
  discount: 0,

  total: 0,
  itemCount: 0,

  addItem: (newItem) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === newItem.productId)
      let nextItems = []
      
      const limit = newItem.stockLimit ?? Infinity
      
      if (existing) {
        const potentialQuantity = existing.quantity + newItem.quantity
        const safeQuantity = Math.min(potentialQuantity, limit)
        
        nextItems = state.items.map((i) =>
          i.productId === newItem.productId
            ? {
                ...i,
                quantity: safeQuantity,
                subtotal: safeQuantity * i.unitPrice,
              }
            : i,
        )
      } else {
        const safeQuantity = Math.min(newItem.quantity, limit)
        nextItems = [
          ...state.items,
          { ...newItem, quantity: safeQuantity, subtotal: safeQuantity * newItem.unitPrice },
        ]
      }

      const itemCount = nextItems.reduce((sum, item) => sum + item.quantity, 0)
      const total = nextItems.reduce((sum, item) => sum + item.subtotal, 0) - state.discount

      return { items: nextItems, itemCount, total }
    }),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      const item = state.items.find(i => i.productId === productId)
      const limit = item?.stockLimit ?? Infinity
      const safeQuantity = Math.min(quantity, limit)

      const nextItems =
        quantity <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: safeQuantity, subtotal: safeQuantity * i.unitPrice }
                : i,
            )
      
      const itemCount = nextItems.reduce((sum, item) => sum + item.quantity, 0)
      const total = nextItems.reduce((sum, item) => sum + item.subtotal, 0) - state.discount

      return { items: nextItems, itemCount, total }
    }),

  removeItem: (productId) =>
    set((state) => {
      const nextItems = state.items.filter((i) => i.productId !== productId)
      const itemCount = nextItems.reduce((sum, item) => sum + item.quantity, 0)
      const total = nextItems.reduce((sum, item) => sum + item.subtotal, 0) - state.discount

      return { items: nextItems, itemCount, total }
    }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCustomer: (customerId) => set({ customerId }),
  setDiscount: (discount) => 
    set((state) => ({ 
      discount,
      total: state.items.reduce((sum, item) => sum + item.subtotal, 0) - discount
    })),
  clearCart: () =>
    set({ items: [], paymentMethod: 'cash', customerId: null, discount: 0, total: 0, itemCount: 0 }),
}))
