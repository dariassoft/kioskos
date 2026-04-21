import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  tenant_id: string
  branch_id?: string
  referral_code?: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean

  // Acciones
  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
  updateUser: (partial: Partial<AuthUser>) => void
}

/**
 * Store de autenticación con persistencia en localStorage.
 * El token JWT se guarda para sobrevivir recargas de página.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'kioskos-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
