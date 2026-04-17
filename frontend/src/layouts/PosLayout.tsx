import { useMemo, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/auth.store'
import { useBranchStore } from '@store/branch.store'
import { useBranches } from '@hooks/useSettings'
import { LogOut, LayoutGrid, Store, Power } from 'lucide-react'
import { useActiveRegister, useCloseRegister } from '@hooks/useSales'

interface PosLayoutProps {
  children: ReactNode
}

/**
 * PosLayout — Pantalla completa para el terminal de ventas.
 * Sin sidebar. Optimizado para teclado y pantallas táctiles.
 */
export default function PosLayout({ children }: PosLayoutProps) {
  const { user, logout } = useAuthStore()
  const { activeBranch } = useBranchStore()
  const navigate = useNavigate()
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closingBalance, setClosingBalance] = useState('')
  const { data: activeRegister } = useActiveRegister(activeBranch?.id || '')
  const closeRegister = useCloseRegister()

  // Carga las sucursales y auto-selecciona la principal si no hay ninguna activa
  useBranches()

  const defaultClosingBalance = useMemo(
    () => Number((Number(activeRegister?.opening_balance ?? 0) + Number(activeRegister?.cash_sales ?? 0)).toFixed(2)),
    [activeRegister?.opening_balance, activeRegister?.cash_sales],
  )

  const parsedClosingBalance = Number(closingBalance)
  const hasValidClosingBalance = closingBalance !== '' && !Number.isNaN(parsedClosingBalance)
  const closingDifference = useMemo(
    () => Number((hasValidClosingBalance ? parsedClosingBalance - defaultClosingBalance : 0).toFixed(2)),
    [defaultClosingBalance, hasValidClosingBalance, parsedClosingBalance],
  )
  const closingDifferenceLabel = hasValidClosingBalance
    ? closingDifference === 0
      ? 'Sin diferencia'
      : closingDifference > 0
        ? 'A depositar'
        : 'Ajuste de caja'
    : 'Ingresa un monto'

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const handleGoToMenu = () => {
    navigate('/dashboard')
  }

  const handleCloseCashRegister = () => {
    if (!activeBranch) return
    setClosingBalance(String(defaultClosingBalance))
    setShowCloseModal(true)
  }

  const handleConfirmCloseRegister = () => {
    if (!activeBranch) return

    const balance = Number(closingBalance)
    if (Number.isNaN(balance) || balance < 0) return

    closeRegister.mutate(
      { branchId: activeBranch.id, balance },
      {
        onSuccess: () => {
          setShowCloseModal(false)
          handleGoToMenu()
        },
      },
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header mínimo del POS */}
      <header className="h-12 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-[10px] md:text-sm font-bold truncate leading-tight">
              Kioskos & Despenzas
            </span>
            {activeBranch && (
              <span className="text-slate-400 text-[9px] md:text-xs font-normal truncate">
                {activeBranch.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3">
          <span className="hidden md:flex text-slate-400 text-xs">
            {user?.name} · <span className="capitalize">{user?.role}</span>
          </span>
          <button
            onClick={handleGoToMenu}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Volver al menú principal"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden xs:inline text-xs font-medium">Menú</span>
          </button>
          <button
            onClick={handleCloseCashRegister}
            disabled={closeRegister.isPending || !activeRegister}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:text-rose-100 hover:bg-rose-900/50 transition-colors disabled:opacity-40"
            title={activeRegister ? 'Cerrar caja' : 'No hay caja abierta'}
          >
            <Power className="w-4 h-4" />
            <span className="hidden xs:inline text-xs font-medium">
              {closeRegister.isPending ? '...' : 'Cerrar'}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded hover:bg-red-900/40 text-slate-400 hover:text-red-400"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Contenido del POS — ocupa toda la pantalla restante */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {showCloseModal && activeRegister && activeBranch && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-semibold text-foreground">Cerrar caja</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Puedes volver al menú principal sin cerrar la caja, o cerrarla definitivamente.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Sucursal: {activeBranch.name}</p>
                <p>Apertura: ${Number(activeRegister.opening_balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                <p>Ventas en efectivo: ${Number(activeRegister.cash_sales).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="rounded-xl border border-border bg-slate-50 p-4 dark:bg-slate-900/40">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-sm font-semibold text-foreground">Resumen final de caja</p>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Cierre sugerido</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-background border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Monto sugerido</p>
                    <p className="font-semibold text-foreground">
                      ${defaultClosingBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Monto ingresado</p>
                    <p className="font-semibold text-foreground">
                      {hasValidClosingBalance
                        ? `$${parsedClosingBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                        : 'Ingresa un monto'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background border border-border p-3 col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Diferencia</p>
                    <p className={`font-semibold ${hasValidClosingBalance ? (closingDifference === 0 ? 'text-emerald-600' : closingDifference > 0 ? 'text-amber-600' : 'text-rose-600') : 'text-muted-foreground'}`}>
                      {hasValidClosingBalance
                        ? `${closingDifference === 0 ? '$0.00' : `${closingDifference > 0 ? '+' : '-'}$${Math.abs(closingDifference).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}`
                        : 'Ingresa un monto'}
                    </p>
                    <p className={`mt-1 text-xs font-medium ${hasValidClosingBalance ? (closingDifference === 0 ? 'text-emerald-600' : closingDifference > 0 ? 'text-amber-600' : 'text-rose-600') : 'text-muted-foreground'}`}>
                      {closingDifferenceLabel}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Revisa el efectivo contado antes de cerrar. Si el monto difiere del sugerido, quedará registrado como ajuste de caja.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Monto de cierre
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-semibold transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseModal(false)
                    handleGoToMenu()
                  }}
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Volver al menú sin cerrar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCloseRegister}
                  disabled={closeRegister.isPending || Number.isNaN(Number(closingBalance)) || Number(closingBalance) < 0}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {closeRegister.isPending ? 'Cerrando caja...' : 'Cerrar definitivamente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
