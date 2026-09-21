import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookUser,
  CreditCard,
  Landmark,
  Search,
  Wallet,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useCurrentAccountDetail, useCurrentAccounts } from '@hooks/useCurrentAccounts'
import { usePayDebt } from '@hooks/useSales'
import type { CurrentAccountType } from '@api/current-accounts.types'

const formatMoney = (value: number) => `$${Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

const movementLabels: Record<string, string> = {
  opening_balance: 'Saldo inicial',
  sale: 'Venta fiada',
  purchase: 'Compra recibida',
  payment: 'Pago / abono',
  return: 'Devolución',
}

export default function CurrentAccountsPage() {
  const [type, setType] = useState<CurrentAccountType>('customer')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const { data: accounts, isLoading } = useCurrentAccounts(type, search)
  const { data: detail, isLoading: detailLoading } = useCurrentAccountDetail(type, selectedId)

  useEffect(() => {
    if (!accounts?.data.length) {
      setSelectedId(undefined)
      return
    }
    if (!selectedId || !accounts.data.some((account) => account.id === selectedId)) {
      setSelectedId(accounts.data[0].id)
    }
  }, [accounts, selectedId])

  const totals = useMemo(() => {
    if (!detail) return { increases: 0, decreases: 0 }
    return detail.entries.reduce((result, entry) => {
      result[entry.balance_effect === 'increase' ? 'increases' : 'decreases'] += Number(entry.amount)
      return result
    }, { increases: 0, decreases: 0 })
  }, [detail])

  const changeType = (nextType: CurrentAccountType) => {
    setType(nextType)
    setSelectedId(undefined)
    setSearch('')
    setPaymentOpen(false)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Cuentas corrientes</h1>
        <p className="text-muted-foreground mt-1 text-sm">Consulta los movimientos y saldos pendientes de clientes y proveedores.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex gap-2 rounded-xl bg-muted/40 p-1 w-fit">
          <button onClick={() => changeType('customer')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${type === 'customer' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>
            <BookUser className="w-4 h-4" /> Clientes
          </button>
          <button onClick={() => changeType('supplier')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${type === 'supplier' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>
            <Landmark className="w-4 h-4" /> Proveedores
          </button>
        </div>
        <label className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${type === 'customer' ? 'cliente' : 'proveedor'}...`} className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)] gap-5">
        <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold">Cuentas habilitadas</h2>
            <span className="text-xs text-muted-foreground">{accounts?.total || 0}</span>
          </div>
          {isLoading ? <p className="py-8 text-center text-muted-foreground text-sm">Cargando cuentas...</p> : !accounts?.data.length ? <p className="py-8 text-center text-muted-foreground text-sm">No hay cuentas para mostrar.</p> : (
            <div className="space-y-2 max-h-[620px] overflow-y-auto">
              {accounts.data.map((account) => (
                <button key={account.id} onClick={() => setSelectedId(account.id)} className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedId === account.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"><Wallet className="w-4 h-4" /></div>
                    <div className="min-w-0 flex-1"><p className="font-semibold truncate">{account.name}</p><p className="text-xs text-muted-foreground truncate">{account.phone || account.email || 'Sin datos de contacto'}</p></div>
                    <p className={`font-bold text-sm whitespace-nowrap ${Number(account.balance) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatMoney(account.balance)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-card border border-border rounded-2xl p-4 md:p-6 min-h-[420px]">
          {!selectedId ? <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground"><Wallet className="w-10 h-10 mb-3 opacity-40" /><p>Selecciona una cuenta para ver sus movimientos.</p></div> : detailLoading || !detail ? <p className="py-16 text-center text-muted-foreground">Cargando movimientos...</p> : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-5">
                <div><p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{type === 'customer' ? 'Cliente' : 'Proveedor'}</p><h2 className="text-2xl font-extrabold mt-1">{detail.account.name}</h2><p className="text-sm text-muted-foreground mt-1">{detail.account.phone || detail.account.email || 'Sin datos de contacto'}</p></div>
                <div className="sm:text-right"><p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Saldo pendiente</p><p className={`text-2xl font-black mt-1 ${Number(detail.balance) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatMoney(detail.balance)}</p>{type === 'customer' && Number(detail.balance) > 0 && <button onClick={() => setPaymentOpen(true)} className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"><CreditCard className="w-4 h-4" /> Registrar abono</button>}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 py-4"><div className="rounded-xl bg-amber-500/10 p-3"><p className="text-xs text-muted-foreground">Cargos</p><p className="font-bold text-amber-700">{formatMoney(totals.increases)}</p></div><div className="rounded-xl bg-emerald-500/10 p-3"><p className="text-xs text-muted-foreground">Abonos y devoluciones</p><p className="font-bold text-emerald-700">{formatMoney(totals.decreases)}</p></div></div>
              <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">{detail.entries.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p> : [...detail.entries].reverse().map((entry) => { const increase = entry.balance_effect === 'increase'; return <div key={entry.id} className="flex items-center gap-3 border-b border-border/70 py-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${increase ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{increase ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold truncate">{entry.description}</p><p className="text-xs text-muted-foreground">{movementLabels[entry.type] || entry.type} · {new Date(entry.date).toLocaleDateString('es-AR')} {new Date(entry.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p></div><p className={`font-bold text-sm whitespace-nowrap ${increase ? 'text-amber-600' : 'text-emerald-600'}`}>{increase ? '+' : '-'}{formatMoney(entry.amount)}</p></div> })}</div>
            </>
          )}
        </section>
      </div>

      {paymentOpen && detail && <CustomerPaymentModal customerId={detail.account.id} customerName={detail.account.name} balance={detail.balance} onClose={() => setPaymentOpen(false)} />}
    </div>
  )
}

function CustomerPaymentModal({ customerId, customerName, balance, onClose }: { customerId: string; customerName: string; balance: number; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'cash' | 'transfer' | 'bank'>('cash')
  const [notes, setNotes] = useState('')
  const payDebt = usePayDebt()
  const submit = () => {
    const value = Number(amount)
    if (value <= 0 || value > Number(balance)) {
      toast.error('El importe debe ser mayor a cero y no superar el saldo pendiente')
      return
    }
    payDebt.mutate({ id: customerId, amount: value, payment_method: method, notes: notes.trim() || undefined }, { onSuccess: onClose })
  }

  return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4"><div className="flex justify-between items-center"><div><h2 className="text-xl font-bold">Registrar abono</h2><p className="text-sm text-muted-foreground">{customerName}</p></div><button onClick={onClose}><X className="w-5 h-5" /></button></div><div className="rounded-xl bg-muted/30 p-3 text-sm">Saldo pendiente: <strong>{formatMoney(balance)}</strong></div><label className="block text-sm font-semibold">Importe<input type="number" min="0.01" max={balance} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full px-4 py-2.5 bg-background border border-border rounded-xl" /></label><label className="block text-sm font-semibold">Medio<select value={method} onChange={(event) => setMethod(event.target.value as typeof method)} className="mt-1 w-full px-4 py-2.5 bg-background border border-border rounded-xl"><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="bank">Banco</option></select></label><label className="block text-sm font-semibold">Observaciones<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full px-4 py-2.5 bg-background border border-border rounded-xl" placeholder="Opcional" /></label><div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl">Cancelar</button><button onClick={submit} disabled={payDebt.isPending} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold">Confirmar abono</button></div></div></div>
}
