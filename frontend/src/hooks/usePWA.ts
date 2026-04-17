import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detectar si ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    // @ts-ignore (Safari support)
    const isStandaloneSafari = window.navigator.standalone === true
    
    if (isStandalone || isStandaloneSafari) {
      setIsInstalled(true)
    }

    const handler = (e: Event) => {
      // Prevenir el banner automático para controlarlo nosotros
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
      console.log('✅ PWA: beforeinstallprompt capturado')
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detectar cuando el usuario instala la app por otros medios
    const appInstalledHandler = () => {
      setDeferredPrompt(null)
      setIsInstallable(false)
      setIsInstalled(true)
      console.log('✅ PWA: App instalada exitosamente')
    }

    window.addEventListener('appinstalled', appInstalledHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', appInstalledHandler)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return

    // Mostrar el prompt nativo
    await deferredPrompt.prompt()

    // Esperar la elección del usuario
    const { outcome } = await deferredPrompt.userChoice
    console.log(`👤 PWA: Usuario eligió ${outcome}`)

    // Limpiar el prompt diferido (solo se puede usar una vez)
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  return { isInstallable, isInstalled, installApp }
}
