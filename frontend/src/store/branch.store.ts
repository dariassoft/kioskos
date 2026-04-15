import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Branch {
  id: string
  name: string
  is_main_branch: boolean
}

interface BranchState {
  activeBranch: Branch | null
  branches: Branch[]

  setActiveBranch: (branch: Branch) => void
  setBranches: (branches: Branch[]) => void
  clearBranches: () => void
}

/**
 * Store de sucursales.
 * Gestiona qué sucursal está activa para el usuario actual.
 * Persiste la sucursal seleccionada para mantenerla entre recargas.
 */
export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      activeBranch: null,
      branches: [],

      setActiveBranch: (branch) => set({ activeBranch: branch }),
      setBranches: (branches) => set({ branches }),
      clearBranches: () => set({ activeBranch: null, branches: [] }),
    }),
    {
      name: 'kioskos-branch',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
