import { usePwaStore } from '@store/pwa.store'

/**
 * usePWA — Hook simplificado que consume el estado global de la PWA.
 * El evento beforeinstallprompt se captura en App.tsx para no perderlo al navegar.
 */
export function usePWA() {
  const { deferredPrompt, isInstallable, isInstalled, setDeferredPrompt } = usePwaStore()

  const installApp = async () => {
    if (!deferredPrompt) return

    // Mostrar el prompt nativo
    await deferredPrompt.prompt()

    // Esperar la elección del usuario
    const { outcome } = await deferredPrompt.userChoice
    console.log(`👤 PWA: Usuario eligió ${outcome}`)

    // Limpiar el prompt diferido en el store
    setDeferredPrompt(null)
  }

  return { isInstallable, isInstalled, installApp }
}
