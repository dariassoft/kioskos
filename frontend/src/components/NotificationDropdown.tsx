import { useState, useRef, useEffect } from 'react'
import { Bell, Check, Trash2, Info, AlertTriangle } from 'lucide-react'
import { useNotificationStore, Notification } from '@store/notification.store'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationStore()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'low_stock': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'billing': return <Info className="w-4 h-4 text-blue-500" />
      default: return <Bell className="w-4 h-4 text-slate-500" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors group"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-swing group-hover:animate-none' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-in-top">
          {/* Header */}
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Notificaciones</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Alertas del sistema</p>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => markAllAsRead()}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                  title="Marcar todo como leído"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => clearAll()}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Limpiar todo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="max-h-[70vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center opacity-50">
                <Bell className="w-8 h-8 mb-2" />
                <p className="text-sm">Sin notificaciones</p>
                <p className="text-[10px] italic">Todo está en orden por ahora</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group ${!n.read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                  >
                    {!n.read && (
                      <div className="absolute left-1 top-4 w-1 h-8 bg-indigo-600 rounded-full" />
                    )}
                    <div className="flex gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-0.5">
                          <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'} text-foreground truncate`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-1">
                            {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 bg-muted/10 border-t border-border text-center">
              <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">
                Ver todo el historial
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
