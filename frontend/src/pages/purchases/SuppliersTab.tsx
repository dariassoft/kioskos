import { useState } from 'react';
import { Search, Plus, Factory, Edit2 } from 'lucide-react';
import { useSuppliers, useCreateSupplier } from '@hooks/usePurchases';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Supplier } from '@api/purchases.types';

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
  
  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier || {},
  });

  const onSubmit = (data: FormValues) => {
    // Para simplificar, asumimos solo creación.
    createSupplier.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-xl border border-border animate-fade-in">
        <h2 className="text-xl font-bold mb-4">{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Razón Social / Nombre *</label>
            <input {...register('name')} autoFocus className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contacto Mto. (Opcional)</label>
            <input {...register('contact_name')} className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input {...register('phone')} className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax ID / CUIT</label>
              <input {...register('tax_id')} className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-muted rounded-lg font-medium">Cancelar</button>
            <button type="submit" disabled={createSupplier.isPending} className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg shadow-sm hover:bg-primary/90">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuppliersTab() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);

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
          onClick={() => setModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Proveedor
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
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">{supplier.name}</h3>
                    <p className="text-xs text-muted-foreground">{supplier.tax_id || 'Sin CUIT'}</p>
                  </div>
                </div>
                <button className="p-1 hover:bg-muted text-muted-foreground rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-sm bg-muted/30 p-3 rounded-xl">
                 <div>
                   <p className="text-xs text-muted-foreground block mb-0.5">Contacto</p>
                   <p className="font-medium text-foreground truncate">{supplier.contact_name || '-'}</p>
                 </div>
                 <div>
                   <p className="text-xs text-muted-foreground block mb-0.5">Teléfono</p>
                   <p className="font-medium text-foreground truncate">{supplier.phone || '-'}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <SupplierModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
