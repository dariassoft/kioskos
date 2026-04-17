import { useState } from 'react'
import { 
  Building2, Plus, Pencil, Trash2, 
  Check, X, Loader2 
} from 'lucide-react'
import { 
  usePaymentAccounts, 
  useCreatePaymentAccount, 
  useUpdatePaymentAccount, 
  useDeletePaymentAccount 
} from '@hooks/useSales'
import toast from 'react-hot-toast'

export default function PaymentAccountsTab() {
  const { data: accounts, isLoading } = usePaymentAccounts()
  const createMutation = useCreatePaymentAccount()
  const updateMutation = useUpdatePaymentAccount()
  const deleteMutation = useDeletePaymentAccount()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'alias' as 'alias' | 'cbu' | 'other',
    value: '',
    is_active: true
  })

  const handleOpenModal = (account?: any) => {
    if (account) {
      setEditingAccount(account)
      setFormData({
        name: account.name,
        type: account.type,
        value: account.value,
        is_active: account.is_active
      })
    } else {
      setEditingAccount(null)
      setFormData({
        name: '',
        type: 'alias',
        value: '',
        is_active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAccount) {
        await updateMutation.mutateAsync({ id: editingAccount.id, data: formData })
      } else {
        await createMutation.mutateAsync(formData)
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta cuenta?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Cuentas de Cobro</h2>
          <p className="text-sm text-muted-foreground">Configura los Aliases o CBUs donde recibes transferencias bancarias.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva Cuenta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts?.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-border rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">Sin cuentas configuradas</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-2 mx-auto">
              Agrega tu primera cuenta para que los cajeros puedan mostrarla durante las ventas por transferencia.
            </p>
          </div>
        ) : (
          accounts?.map((account) => (
            <div 
              key={account.id} 
              className={`group relative bg-card border border-border rounded-3xl p-5 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 ${!account.is_active && 'opacity-60 grayscale'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                     {account.name}
                     {!account.is_active && <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[10px] uppercase font-bold">Inactiva</span>}
                  </h3>
                  <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {account.type}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors" 
                    onClick={() => handleOpenModal(account)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-xl transition-colors" 
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-2xl font-mono text-sm break-all border border-border/50 text-foreground">
                {account.value}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border animate-scale-up overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta de Cobro'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre de la Cuenta</label>
                <input 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Ej: Banco Galicia" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo</label>
                  <select 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    value={formData.type} 
                    onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="alias">Alias</option>
                    <option value="cbu">CBU / CVU</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                
                <div className="space-y-2 flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`h-[46px] rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                      formData.is_active 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {formData.is_active ? <><Check className="w-4 h-4 mr-2"/> Activa</> : <><X className="w-4 h-4 mr-2"/> Inactiva</>}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alias o CBU</label>
                <input 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Ingresa el dato de cobro" 
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
                <p className="text-[10px] text-muted-foreground">Este dato se mostrará al cliente para realizar el pago.</p>
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full bg-primary text-white rounded-xl py-3 font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
