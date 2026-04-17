import { useState } from 'react'
import { 
  Building2, Plus, Pencil, Trash2, 
  Check, X, Loader2, AlertCircle 
} from 'lucide-react'
import { 
  usePaymentAccounts, 
  useCreatePaymentAccount, 
  useUpdatePaymentAccount, 
  useDeletePaymentAccount 
} from '@hooks/useSales'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    if (editingAccount) {
      await updateMutation.mutateAsync({ id: editingAccount.id, data: formData })
    } else {
      await createMutation.mutateAsync(formData)
    }
    setIsModalOpen(false)
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
        <Button onClick={() => handleOpenModal()} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cuenta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts?.length === 0 ? (
          <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>Sin cuentas configuradas</CardTitle>
            <CardDescription className="max-w-xs mt-2">
              Agrega tu primera cuenta para que los cajeros puedan mostrarla durante las ventas por transferencia.
            </CardDescription>
          </Card>
        ) : (
          accounts?.map((account) => (
            <Card key={account.id} className={`group overflow-hidden transition-all hover:border-primary/50 ${!account.is_active && 'opacity-60 grayscale'}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                       {account.name}
                       {!account.is_active && <Badge variant="secondary" className="text-[10px] uppercase">Inactiva</Badge>}
                    </CardTitle>
                    <Badge variant="outline" className="capitalize text-[11px] h-5 bg-muted/30">
                      {account.type}
                    </Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(account)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(account.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted/50 rounded-xl font-mono text-sm break-all">
                  {account.value}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Creación/Edición */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta de Cobro'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre de la Cuenta</label>
              <Input 
                placeholder="Ej: Banco Galicia" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alias">Alias</SelectItem>
                    <SelectItem value="cbu">CBU / CVU</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium">Estado</label>
                <Button 
                  type="button"
                  variant={formData.is_active ? 'default' : 'outline'}
                  className="rounded-lg h-10"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                >
                  {formData.is_active ? <><Check className="w-4 h-4 mr-2"/> Activa</> : <><X className="w-4 h-4 mr-2"/> Inactiva</>}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Alias o CBU</label>
              <Input 
                placeholder="Ingresa el dato de cobro" 
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
              />
              <p className="text-[10px] text-muted-foreground">Este dato se mostrará al cliente para realizar el pago.</p>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
