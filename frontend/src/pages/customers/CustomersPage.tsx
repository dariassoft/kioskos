import { useState } from 'react'
import {
  Users,
  Search,
  Plus,
  CreditCard,
  Phone,
  MoreVertical,
  Banknote,
  AlertTriangle
} from 'lucide-react'
import { useCustomers, useCreateCustomer, useUpdateCustomer, usePayDebt } from '@hooks/useSales'
import type { Customer } from '@api/sales.types'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  credit_limit: z.coerce.number().min(0, 'El límite debe ser 0 o mayor').default(0),
})

type CustomerFormValues = z.infer<typeof customerSchema>

function CustomerModal({
  customer,
  isOpen,
  onClose,
}: {
  customer?: Customer
  isOpen: boolean
  onClose: () => void
}) {
  const createReq = useCreateCustomer()
  const updateReq = useUpdateCustomer()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || { credit_limit: 0 },
  })

  if (!isOpen) return null

  const onSubmit = (data: CustomerFormValues) => {
    if (customer) {
      updateReq.mutate({ id: customer.id, data }, {
        onSuccess: () => {
          onClose()
          reset()
        }
      })
    } else {
      createReq.mutate(data, {
        onSuccess: () => {
          onClose()
          reset()
        }
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-border">
        <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted-foreground/10 rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre Completo *</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              placeholder="Juan Pérez"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                {...register('phone')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="+54 9 11..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                {...register('email')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="juan@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Límite de Fiado Autorizado ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <input
                type="number"
                step="100"
                {...register('credit_limit')}
                className="w-full pl-7 pr-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none font-medium"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Si es 0, no podrá comprar al fiado.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-accent rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createReq.isPending || updateReq.isPending}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-sm hover:bg-primary/90"
            >
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PayDebtModal({
  customer,
  isOpen,
  onClose,
}: {
  customer?: Customer
  isOpen: boolean
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const payDebt = usePayDebt()

  if (!isOpen || !customer) return null

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount))) return
    payDebt.mutate({ id: customer.id, amount: Number(amount) }, {
      onSuccess: () => {
        setAmount('')
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-border">
         <div className="p-6 text-center">
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Banknote className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Abonar Deuda</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cliente: <span className="font-semibold text-foreground">{customer.name}</span>
            </p>
            <p className="text-base text-destructive font-bold mt-2">
              Deuda Actual: ${Number(customer.current_debt).toLocaleString('es-AR', {minimumFractionDigits: 2})}
            </p>

            <form onSubmit={handlePay} className="mt-6 space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Monto a cancelar ($)</label>
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={customer.current_debt}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-lg font-semibold text-center focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2">
                 <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!amount || payDebt.isPending}
                  className="flex-[2] py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
         </div>
      </div>
    </div>
  )
}


export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers()
  const [search, setSearch] = useState('')
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false)
  const [isPayModalOpen, setPayModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>()

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search)
  )

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerModalOpen(true)
  }

  const handlePay = (customer: Customer) => {
    setSelectedCustomer(customer)
    setPayModalOpen(true)
  }

  const handleNew = () => {
    setSelectedCustomer(undefined)
    setCustomerModalOpen(true)
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Clientes y Fiados</h1>
            <p className="text-muted-foreground mt-1 text-sm">Gestiona la base de clientes y las cuentas corrientes</p>
          </div>
          <button
            onClick={handleNew}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>

        {/* Buscador */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Buscar cliente por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none text-base focus:ring-0 outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Listado */}
        {isLoading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-16 bg-card border border-border rounded-2xl text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No hay clientes registrados aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(customer => {
              const hasDebt = Number(customer.current_debt) > 0
              const limitStr = Number(customer.credit_limit) > 0 ? `$${customer.credit_limit}` : 'Sin fiado'
              const progress = customer.credit_limit > 0 ? (customer.current_debt / customer.credit_limit) * 100 : 0
              const isDanger = progress > 85

              return (
                <div key={customer.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-lg text-slate-500 uppercase">
                        {customer.name.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg leading-tight">{customer.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                           <Phone className="w-3 h-3" /> {customer.phone || 'Sin tel.'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleEdit(customer)} className="p-1.5 hover:bg-muted text-muted-foreground rounded-lg">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-3 mb-4 flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Deuda Vigente</p>
                    <p className={`text-2xl font-extrabold ${hasDebt ? 'text-destructive' : 'text-green-500'}`}>
                      ${Number(customer.current_debt).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                    </p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isDanger ? 'bg-destructive' : 'bg-primary'}`} 
                        style={{ width: `${Math.min(progress, 100)}%` }} 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 flex justify-between">
                      <span>Límite: <strong className="text-foreground">{limitStr}</strong></span>
                      {isDanger && <span className="text-destructive font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Cerca del límite</span>}
                    </p>
                  </div>

                  <button
                    onClick={() => handlePay(customer)}
                    disabled={!hasDebt}
                    className="w-full py-2.5 bg-background border border-border border-b-2 hover:bg-accent rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    Registrar Pago
                  </button>
                </div>
              )
            })}
          </div>
        )}

      </div>

      <CustomerModal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setCustomerModalOpen(false)} 
        customer={selectedCustomer} 
      />
      
      <PayDebtModal
        isOpen={isPayModalOpen}
        onClose={() => setPayModalOpen(false)}
        customer={selectedCustomer}
      />
    </>
  )
}
