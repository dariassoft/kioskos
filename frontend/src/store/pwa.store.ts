import { create } from 'zustand'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PwaState {
  deferredPrompt: BeforeInstallPromptEvent | null
  isInstallable: boolean
  isInstalled: boolean
  
  // Acciones
  setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => void
  setIsInstallable: (status: boolean) => void
  setIsInstalled: (status: boolean) => void
  reset: () => void
}

export const usePwaStore = create<PwaState>((set) => ({
  deferredPrompt: null,
  isInstallable: false,
  isInstalled: false,

  setDeferredPrompt: (e) => set({ deferredPrompt: e, isInstallable: !!e }),
  setIsInstallable: (status) => set({ isInstallable: status }),
  setIsInstalled: (status) => set({ isInstalled: status }),
  reset: () => set({ deferredPrompt: null, isInstallable: false })
}))
