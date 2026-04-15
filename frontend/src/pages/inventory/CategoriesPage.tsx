import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Tag, Loader2, X } from 'lucide-react'
import { useCategories, useCreateCategory } from '@hooks/useInventory'

const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#3b82f6', '#06b6d4',
]

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  color: z.string().optional(),
  icon: z.string().optional(),
})
type CategoryForm = z.infer<typeof categorySchema>

function CategoryModal({ onClose }: { onClose: () => void }) {
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0])
  const createCategory = useCreateCategory()

  const { register, handleSubmit, formState: { errors } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  })

  const onSubmit = (data: CategoryForm) => {
    createCategory.mutate({ ...data, color: selectedColor }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Nueva categoría</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nombre *</label>
            <input
              {...register('name')}
              autoFocus
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Ej: Lácteos, Bebidas, Almacén..."
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-full transition-transform"
                  style={{
                    background: color,
                    transform: selectedColor === color ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: selectedColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-accent">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createCategory.isPending}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium
                         hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {createCategory.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const [showModal, setShowModal] = useState(false)
  const { data: categories = [], isLoading } = useCategories()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{categories.length} categorías</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground
                     rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-32 items-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-card border-2 border-dashed border-border rounded-xl">
          <Tag className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-foreground font-medium">Sin categorías</p>
          <p className="text-xs text-muted-foreground">Añade categorías para organizar tu catálogo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: cat.color ? `${cat.color}20` : 'var(--muted)' }}
              >
                <Tag className="w-4 h-4" style={{ color: cat.color ?? 'var(--muted-foreground)' }} />
              </div>
              <span className="font-medium text-foreground text-sm truncate">{cat.name}</span>
            </div>
          ))}
        </div>
      )}

      {showModal && <CategoryModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
