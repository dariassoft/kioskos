import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'low_stock' | 'system' | 'billing'
  timestamp: string
  read: boolean
  data?: any
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notif) => set((state) => {
        const newNotif: Notification = {
          ...notif,
          id: Math.random().toString(36).substring(7),
          read: false,
          timestamp: new Date().toISOString(),
        }
        const updated = [newNotif, ...state.notifications].slice(0, 50) // Mantener últimas 50
        return {
          notifications: updated,
          unreadCount: updated.filter(n => !n.read).length
        }
      }),

      markAsRead: (id) => set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
        return {
          notifications: updated,
          unreadCount: updated.filter(n => !n.read).length
        }
      }),

      markAllAsRead: () => set((state) => {
        const updated = state.notifications.map((n) => ({ ...n, read: true }))
        return {
          notifications: updated,
          unreadCount: 0
        }
      }),

      clearAll: () => set({
        notifications: [],
        unreadCount: 0
      }),
    }),
    {
      name: 'notification-storage',
    }
  )
)
