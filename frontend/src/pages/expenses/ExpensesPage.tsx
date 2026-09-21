import { useState, useMemo, useRef } from 'react'
import {
  Receipt, Plus, X, Trash2, Edit2, Loader2, Ban,
  Banknote, CreditCard, ArrowLeftRight, Camera, Eye,
  Palette, Tag,
} from 'lucide-react'
import { PAYMENT_METHOD_LABELS, type ExpensePaymentMethod, type Expense, type ExpenseCategory } from '@api/expenses.api'
import {
  useExpenses, useExpenseCategories, useExpenseSummary,
  useCreateExpense, useUpdateExpense, useVoidExpense,
  useCreateExpenseCategory, useUpdateExpenseCategory, useDeleteExpenseCategory,
  useSeedExpenseCategories,
} from '@hooks/useExpenses'

const PAYMENT_ICONS: Record<ExpensePaymentMethod, typeof Banknote> = {
  cash: Banknote, card: CreditCard, transfer: ArrowLeftRight,
}

const today = new Date().toISOString().slice(0, 10)
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

export default function ExpensesPage() {
  const [tab, setTab] = useState<'expenses' | 'categories'>('expenses')
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Receipt className="w-8 h-8 text-rose-500" /> Gastos
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Registrá y controlá los gastos operativos de tu negocio</p>
      </div>
      <div className="flex gap-4 border-b border-border pb-px">
        {[
          { key: 'expenses' as const, label: 'Gastos', icon: Receipt },
          { key: 'categories' as const, label: 'Categorías', icon: Tag },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-semibold relative transition-colors ${tab === t.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <div className="flex items-center gap-2 px-2"><t.icon className="w-4 h-4" />{t.label}</div>
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
          </button>
        ))}
      </div>
      {tab === 'expenses' ? <ExpensesTab /> : <CategoriesTab />}
    </div>
  )
}

// ==========================================
// TAB: GASTOS
// ==========================================
function ExpensesTab() {
  const [startDate, setStartDate] = useState(monthStart)
  const [endDate, setEndDate] = useState(today)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modal, setModal] = useState<{ open: boolean; expense: Expense | null }>({ open: false, expense: null })
  const [receiptModal, setReceiptModal] = useState<string | null>(null)
  const [voidingExpense, setVoidingExpense] = useState<Expense | null>(null)

  const { data: expenses = [], isLoading } = useExpenses({ start_date: startDate, end_date: endDate, category_id: categoryFilter || undefined })
  const { data: categories = [] } = useExpenseCategories()
  const { data: summary } = useExpenseSummary({ start_date: startDate, end_date: endDate })
  const voidMut = useVoidExpense()

  const fmt = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v)
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total del Período</p>
          <p className="text-3xl font-black text-foreground mt-1">{fmt(summary?.total || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary?.count || 0} gastos registrados</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 sm:col-span-2">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3">Por Categoría</p>
          <div className="flex flex-wrap gap-2">
            {(summary?.by_category || []).map((c) => (
              <span key={c.category_name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-border bg-background">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.category_color }} />
                {c.category_name}: {fmt(c.total)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Desde</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="block w-full bg-card border border-border rounded-xl px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Hasta</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="block w-full bg-card border border-border rounded-xl px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Categoría</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full bg-card border border-border rounded-xl px-3 py-2 text-sm">
            <option value="">Todas</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={() => setModal({ open: true, expense: null })}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" /> Registrar Gasto
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-rose-500" /></div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold">No hay gastos en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Descripción</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Categoría</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Método</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Monto</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Observaciones</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((exp) => {
                  const cat = catMap.get(exp.category_id)
                  const MethodIcon = PAYMENT_ICONS[exp.payment_method] || Banknote
                  return (
                    <tr key={exp.id} className={`hover:bg-muted/30 transition-colors ${exp.status === 'voided' ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{new Date(exp.date + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{exp.description}</p>
                        {exp.receipt_number && <p className="text-xs text-muted-foreground">Comp: {exp.receipt_number}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: (cat?.color || '#6b7280') + '20', color: cat?.color || '#6b7280' }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color }} />
                          {cat?.name || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MethodIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{PAYMENT_METHOD_LABELS[exp.payment_method]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">{fmt(Number(exp.amount))}{exp.status === 'voided' && <span className="block text-[10px] text-destructive uppercase">Anulado</span>}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                        {exp.notes && <p className="line-clamp-2">{exp.notes}</p>}
                        {exp.receipt_image && (
                          <button onClick={() => setReceiptModal(exp.receipt_image)}
                            className="mt-1 inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-700 font-bold">
                            <Eye className="w-3 h-3" /> Ver comprobante
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {exp.status === 'active' && <button onClick={() => setModal({ open: true, expense: exp })}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"><Edit2 className="w-3.5 h-3.5" /></button>}
                          {exp.status === 'active' && <button onClick={() => setVoidingExpense(exp)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Anular gasto"><Ban className="w-3.5 h-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && <ExpenseModal expense={modal.expense} categories={categories} onClose={() => setModal({ open: false, expense: null })} />}
      {voidingExpense && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4"><div className="flex justify-between items-center"><h2 className="text-xl font-bold">Anular gasto</h2><button onClick={() => setVoidingExpense(null)}><X className="w-5 h-5" /></button></div><p className="text-sm text-muted-foreground">Esta acción conserva el gasto y revierte su asiento contable.</p><textarea id="void-reason" placeholder="Motivo obligatorio" className="w-full p-3 bg-background border border-border rounded-xl" /><div className="flex gap-2"><button onClick={() => setVoidingExpense(null)} className="flex-1 py-2 border rounded-xl">Cancelar</button><button onClick={() => { const reason = (document.getElementById('void-reason') as HTMLTextAreaElement)?.value.trim(); if (!reason) return; voidMut.mutate({ id: voidingExpense.id, reason }, { onSuccess: () => setVoidingExpense(null) }) }} disabled={voidMut.isPending} className="flex-1 py-2 bg-destructive text-white rounded-xl font-bold">Confirmar anulación</button></div></div></div>}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setReceiptModal(null)}>
          <div className="max-w-2xl max-h-[80vh] overflow-auto bg-card rounded-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <img src={receiptModal} alt="Comprobante" className="w-full rounded-xl" />
            <button onClick={() => setReceiptModal(null)} className="mt-2 w-full py-2 bg-muted rounded-xl text-sm font-bold">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// MODAL: CREAR/EDITAR GASTO
// ==========================================
function ExpenseModal({ expense, categories, onClose }: { expense: Expense | null; categories: ExpenseCategory[]; onClose: () => void }) {
  const createMut = useCreateExpense()
  const updateMut = useUpdateExpense()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    description: expense?.description || '',
    amount: expense?.amount?.toString() || '',
    date: expense?.date || today,
    category_id: expense?.category_id || (categories[0]?.id || ''),
    payment_method: (expense?.payment_method || 'cash') as ExpensePaymentMethod,
    receipt_number: expense?.receipt_number || '',
    notes: expense?.notes || '',
    receipt_image: expense?.receipt_image || '',
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('La imagen no puede superar los 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, receipt_image: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, amount: Number(form.amount), receipt_image: form.receipt_image || undefined, receipt_number: form.receipt_number || undefined, notes: form.notes || undefined }
    if (expense) {
      updateMut.mutate({ id: expense.id, data: payload }, { onSuccess: onClose })
    } else {
      createMut.mutate(payload, { onSuccess: onClose })
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold">{expense ? 'Editar Gasto' : 'Registrar Gasto'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Descripción *</label>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm mt-1" placeholder="Ej: Alquiler local - Junio" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Monto *</label>
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm mt-1" placeholder="50000" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Fecha *</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Categoría *</label>
              <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} required
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm mt-1">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Método de Pago *</label>
              <select value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value as ExpensePaymentMethod }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm mt-1">
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Nro. Comprobante</label>
            <input value={form.receipt_number} onChange={(e) => setForm((f) => ({ ...f, receipt_number: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm mt-1" placeholder="FC-001234" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Observaciones</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm mt-1 resize-none"
              placeholder="Cuenta bancaria, tarjeta utilizada, detalles..." />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Foto del Comprobante</label>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
            <div className="flex items-center gap-3 mt-1">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm font-bold hover:bg-accent transition-colors">
                <Camera className="w-4 h-4" /> {form.receipt_image ? 'Cambiar Imagen' : 'Adjuntar Foto'}
              </button>
              {form.receipt_image && (
                <div className="relative">
                  <img src={form.receipt_image} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-border" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, receipt_image: '' }))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <button type="submit" disabled={isPending}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
            {expense ? 'Guardar Cambios' : 'Registrar Gasto'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ==========================================
// TAB: CATEGORÍAS
// ==========================================
function CategoriesTab() {
  const { data: categories = [], isLoading } = useExpenseCategories()
  const createMut = useCreateExpenseCategory()
  const updateMut = useUpdateExpenseCategory()
  const deleteMut = useDeleteExpenseCategory()
  const seedMut = useSeedExpenseCategories()
  const [modal, setModal] = useState<{ open: boolean; cat: ExpenseCategory | null }>({ open: false, cat: null })
  const [form, setForm] = useState({ name: '', color: '#6366f1' })

  const openNew = () => { setForm({ name: '', color: '#6366f1' }); setModal({ open: true, cat: null }) }
  const openEdit = (c: ExpenseCategory) => { setForm({ name: c.name, color: c.color }); setModal({ open: true, cat: c }) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (modal.cat) {
      updateMut.mutate({ id: modal.cat.id, data: form }, { onSuccess: () => setModal({ open: false, cat: null }) })
    } else {
      createMut.mutate(form, { onSuccess: () => setModal({ open: false, cat: null }) })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" /> Nueva Categoría
        </button>
        {categories.length === 0 && (
          <button onClick={() => seedMut.mutate()} disabled={seedMut.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
            <Palette className="w-4 h-4" /> Crear Categorías por Defecto
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-rose-500" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between group hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                  <Tag className="w-5 h-5" style={{ color: cat.color }} />
                </div>
                <div>
                  <p className="font-bold text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.color}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-accent"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => { if (confirm(`¿Eliminar "${cat.name}"?`)) deleteMut.mutate(cat.id) }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModal({ open: false, cat: null })}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold">{modal.cat ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button onClick={() => setModal({ open: false, cat: null })} className="p-1 rounded-lg hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Nombre *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Color</label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <span className="text-sm font-mono text-muted-foreground">{form.color}</span>
                </div>
              </div>
              <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                {modal.cat ? 'Guardar' : 'Crear Categoría'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
