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

    const socket: Socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      query: { tenantId: user.tenant_id }
    })

    const handleLowStock = (data: { productName: string; currentStock: number; minAlert: number }) => {
      addNotification({
        title: 'Stock Bajo Detectado',
        message: `El producto "${data.productName}" tiene ${data.currentStock} unidades (Mínimo: ${data.minAlert})`,
        type: 'low_stock',
        data
      })
      
      // Intentar emitir un sonido sutil si es posible
      try {
        const audio = new Audio('/assets/notification.mp3')
        audio.volume = 0.4
        audio.play().catch(() => {}) // Ignorar si el navegador bloquea el auto-play
      } catch (e) {}
    }

    socket.on('low_stock_alert', handleLowStock)

    return () => {
      socket.off('low_stock_alert', handleLowStock)
      socket.disconnect()
    }
  }, [user?.tenant_id, addNotification])
}
