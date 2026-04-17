import { useState, useEffect } from 'react';
import { Search, Plus, Factory, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@hooks/usePurchases';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Supplier } from '@api/purchases.types';
import toast from 'react-hot-toast';

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  contact_name: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  tax_id: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof supplierSchema>;

function SupplierModal({
  isOpen,
  onClose,
  supplier
}: {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier;
}) {
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier || { name: '', contact_name: '', phone: '', email: '', tax_id: '' },
  });

  // Re-sync default values when supplier changes
  useEffect(() => {
    if (supplier) reset(supplier);
    else reset({ name: '', contact_name: '', phone: '', email: '', tax_id: '' });
  }, [supplier, reset]);

  const onSubmit = (data: FormValues) => {
    if (supplier) {
      updateSupplier.mutate({ id: supplier.id, data }, {
        onSuccess: () => onClose()
      });
    } else {
      createSupplier.mutate(data, {
        onSuccess: () => {
          reset();
          onClose();
        }
      });
    }
  };

  const handleDelete = () => {
    if (!supplier) return;
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-foreground">¿Eliminar proveedor? <br/><span className="text-xs font-normal text-muted-foreground">{supplier.name}</span></p>
        <div className="flex gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-3 py-1 bg-muted rounded-md text-xs">No, cancelar</button>
          <button onClick={() => { deleteSupplier.mutate(supplier.id); toast.dismiss(t.id); onClose(); }} className="flex-1 px-3 py-1 bg-destructive text-white rounded-md text-xs font-bold">Sí, eliminar</button>
        </div>
      </div>
    ), { duration: 5000, position: 'bottom-center' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-border animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-xl font-bold">{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"><X className="w-5 h-5"/></button>
        </div>

        <form id="supplier-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Razón Social / Nombre *</label>
            <input {...register('name')} autoFocus className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40" />
            {errors.name && <p className="text-destructive text-[10px] mt-1 font-bold">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Nombre de Contacto (Opcional)</label>
            <input {...register('contact_name')} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Teléfono</label>
              <input {...register('phone')} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">CUIT / Tax ID</label>
              <input {...register('tax_id')} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Correo Electrónico</label>
            <input {...register('email')} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40" placeholder="proveedor@email.com" />
            {errors.email && <p className="text-destructive text-[10px] mt-1 font-bold">{errors.email.message}</p>}
          </div>
        </form>

        {/* Footer sticky */}
        <div className="p-5 border-t border-border bg-muted/20 flex flex-col gap-3">
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-background border border-border rounded-xl font-bold hover:bg-muted">Cerrar</button>
            <button 
              form="supplier-form"
              type="submit" 
              disabled={createSupplier.isPending || updateSupplier.isPending} 
              className="flex-1 py-3 bg-primary text-primary-foreground font-black rounded-xl shadow-lg hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              {(createSupplier.isPending || updateSupplier.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {supplier ? 'Guardar Cambios' : 'Crear Proveedor'}
            </button>
          </div>
          {supplier && (
            <button type="button" onClick={handleDelete} className="w-full py-2 text-destructive font-bold text-xs hover:bg-destructive/10 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Trash2 className="w-3.5 h-3.5" /> ELIMINAR PROVEEDOR
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuppliersTab() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>();

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedSupplier(undefined);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedSupplier(undefined);
  };

  const filtered = suppliers.filter((s: Supplier) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proveedor..."
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50"
          />
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Agregar Proveedor</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-16 bg-card border border-border rounded-2xl text-muted-foreground">
          <Factory className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No hay proveedores registrados aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((supplier: Supplier) => (
            <div key={supplier.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                    {supplier.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground leading-tight truncate">{supplier.name}</h3>
                    <p className="text-xs text-muted-foreground">{supplier.tax_id || 'Sin CUIT'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleEdit(supplier)}
                  className="p-1.5 hover:bg-muted text-muted-foreground rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-sm bg-muted/30 p-3 rounded-xl">
                 <div className="min-w-0">
                   <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mb-0.5">Contacto</p>
                   <p className="font-medium text-foreground truncate">{supplier.contact_name || '-'}</p>
                 </div>
                 <div className="min-w-0">
                   <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mb-0.5">Teléfono</p>
                   <p className="font-medium text-foreground truncate">{supplier.phone || '-'}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <SupplierModal isOpen={isModalOpen} onClose={handleClose} supplier={selectedSupplier} />
    </div>
  );
}
