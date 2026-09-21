import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Award, Loader2, X, Search, Trash2, Pencil } from 'lucide-react'
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '@hooks/useInventory'
import type { Brand } from '@api/inventory.types'
import ConfirmModal from '@components/ConfirmModal'

const brandSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
})
type BrandForm = z.infer<typeof brandSchema>

function BrandModal({ onClose, brand }: { onClose: () => void; brand?: Brand }) {
  const createBrand = useCreateBrand(); const updateBrand = useUpdateBrand()

  const { register, handleSubmit, formState: { errors } } = useForm<BrandForm>({
    resolver: zodResolver(brandSchema),
  })

  const onSubmit = (data: BrandForm) => {
    brand ? updateBrand.mutate({ id: brand.id, data }, { onSuccess: onClose }) : createBrand.mutate(data, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
           <h2 className="font-semibold text-foreground">{brand ? 'Editar marca' : 'Nueva marca'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nombre de la marca *</label>
              <input defaultValue={brand?.name}
              {...register('name')}
              autoFocus
              className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Ej: Coca-Cola, Arcor, Quilmes..."
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-border rounded-xl text-sm hover:bg-accent">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createBrand.isPending}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
               {(createBrand.isPending || updateBrand.isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
               {brand ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BrandsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Brand | undefined>()
  const [search, setSearch] = useState('')
  const { data: brands = [], isLoading } = useBrands()
  const deleteBrand = useDeleteBrand()
  const [deleting, setDeleting] = useState<Brand | null>(null)

  const filteredBrands = brands.filter((b: Brand) => b.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar marca..."
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <button
           onClick={() => { setEditing(undefined); setShowModal(true) }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Agregar Marca
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-48 items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-card border-2 border-dashed border-border rounded-3xl animate-fade-in">
          <Award className="w-12 h-12 text-muted-foreground/20 mb-3" />
          <p className="text-foreground font-bold">Sin marcas</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center px-4">
            {search ? 'No se encontraron marcas para tu búsqueda.' : 'Registra las marcas de tus proveedores para organizar mejor el inventario.'}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="mt-4 text-primary text-xs font-bold uppercase tracking-widest hover:underline">Limpiar filtros</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredBrands.map((brand: Brand) => (
            <div
              key={brand.id}
              className="group flex flex-col items-center justify-center p-6 bg-card border border-border rounded-3xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all text-center relative overflow-hidden"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7 text-primary" />
              </div>
              <span className="font-bold text-foreground text-sm line-clamp-2">{brand.name}</span>
              
               <button title="Editar" className="absolute top-2 left-2 p-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all" onClick={() => { setEditing(brand); setShowModal(true) }}>
                 <Pencil className="w-3.5 h-3.5" />
               </button>
               <button 
                className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  onClick={() => setDeleting(brand)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

       {showModal && <BrandModal brand={editing} onClose={() => setShowModal(false)} />}
       <ConfirmModal isOpen={!!deleting} title="Eliminar marca" message={deleting ? `¿Eliminar ${deleting.name}? Los productos asociados quedarán sin marca.` : ''} onClose={() => setDeleting(null)} onConfirm={() => deleting && deleteBrand.mutate(deleting.id, { onSuccess: () => setDeleting(null) })} isPending={deleteBrand.isPending} />
    </div>
  )
}
