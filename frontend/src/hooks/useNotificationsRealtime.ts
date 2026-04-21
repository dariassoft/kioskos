import { useEffect } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@store/auth.store'
import { useNotificationStore } from '@store/notification.store'

/**
 * useNotificationsRealtime — Hook para escuchar notificaciones WebSocket.
 * Maneja la conexión al salón del tenant y procesa alertas de stock bajo.
 */
export function useNotificationsRealtime() {
  const { user } = useAuthStore()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (!user?.tenant_id) return

    // Determinar la URL del WebSocket:
    // 1. Usar VITE_WS_URL si existe
    // 2. Fallback a VITE_API_URL (quitando /api/v1)
    // 3. Fallback a origin actual
    let socketUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || window.location.origin
    socketUrl = socketUrl.replace(/\/api\/v1$/, '') // Asegurar que sea el base

    const socket: Socket = io(socketUrl, {
      transports: ['websocket'],
      query: { tenantId: user.tenant_id }
    })

    const handleReferralSuccess = (data: { newBusinessName: string; discountPercentage: number; message: string }) => {
      addNotification({
        title: '¡Nueva Referencia Exitosa!',
        message: data.message,
        type: 'referral',
        data
      })
    }

    const handleGeneralNotification = (data: { title: string; message: string; variant?: string }) => {
      addNotification({
        title: data.title,
        message: data.message,
        type: 'general',
        data
      })
    }

    socket.on('low_stock_alert', handleLowStock)
    socket.on('referral_success_alert', handleReferralSuccess)
    socket.on('general_notification', handleGeneralNotification)

    return () => {
      socket.off('low_stock_alert', handleLowStock)
      socket.off('referral_success_alert', handleReferralSuccess)
      socket.off('general_notification', handleGeneralNotification)
      socket.disconnect()
    }
  }, [user?.tenant_id, addNotification])
}
