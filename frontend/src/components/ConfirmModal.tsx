import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
  isPending?: boolean
}

export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Eliminar', onConfirm, onClose, isPending = false }: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl animate-fade-in">
        <div className="flex items-start justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-destructive/10 p-2 text-destructive"><AlertTriangle className="h-5 w-5" /></div>
            <h2 className="font-semibold text-foreground">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent" aria-label="Cerrar"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5"><p className="text-sm leading-relaxed text-muted-foreground">{message}</p></div>
        <div className="flex gap-3 border-t border-border p-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-accent">Cancelar</button>
          <button onClick={onConfirm} disabled={isPending} className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60">{isPending ? 'Eliminando...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
