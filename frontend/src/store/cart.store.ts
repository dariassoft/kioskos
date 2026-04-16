import { create } from 'zustand'

export interface CartItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
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
export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  paymentMethod: 'cash',
  customerId: null,
  discount: 0,

  get total() {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0) - get().discount
  },
  get itemCount() {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },

  addItem: (newItem) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === newItem.productId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === newItem.productId
              ? {
                  ...i,
                  quantity: i.quantity + newItem.quantity,
                  subtotal: (i.quantity + newItem.quantity) * i.unitPrice,
                }
              : i,
          ),
        }
      }
      return {
        items: [
          ...state.items,
          { ...newItem, subtotal: newItem.quantity * newItem.unitPrice },
        ],
      }
    }),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.map((i) =>
              i.productId === productId
                ? { ...i, quantity, subtotal: quantity * i.unitPrice }
                : i,
            ),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCustomer: (customerId) => set({ customerId }),
  setDiscount: (discount) => set({ discount }),
  clearCart: () =>
    set({ items: [], paymentMethod: 'cash', customerId: null, discount: 0 }),
}))
