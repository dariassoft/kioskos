import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, X, ChefHat, Scissors, Loader2 } from 'lucide-react';
import { useRecipes, useCreateRecipe, useDeleteRecipe } from '@hooks/useProduction';
import { useProducts } from '@hooks/useInventory';
import type { Recipe } from '@api/production.types';
import type { Product } from '@api/inventory.types';

interface RecipeForm {
  name: string;
  type: 'fractioning' | 'elaboration';
  output_product_id: string;
  output_quantity: number;
  notes?: string;
  items: { product_id: string; quantity: number }[];
}

function RecipeModal({ onClose }: { onClose: () => void }) {
  const { data: productsPage } = useProducts({ limit: 500 });
  const products: Product[] = productsPage?.data ?? [];
  const createRecipe = useCreateRecipe();

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<RecipeForm>({
    defaultValues: {
      type: 'fractioning',
      output_quantity: 1,
      items: [{ product_id: '', quantity: 1 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const recipeType = watch('type');

  const onSubmit = (data: RecipeForm) => {
    createRecipe.mutate({
      name: data.name,
      type: data.type,
      output_product_id: data.output_product_id,
      output_quantity: Number(data.output_quantity),
      notes: data.notes || undefined,
      items: data.items
        .filter((i) => i.product_id && Number(i.quantity) > 0)
        .map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity) })),
    }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-2xl rounded-2xl p-6 shadow-xl border border-border animate-fade-in my-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Nueva Receta</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Nombre</label>
              <input
                {...register('name', { required: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                placeholder="Ej: Alimento 20kg → bolsas 1kg"
              />
              {errors.name && <p className="text-xs text-destructive mt-1">Requerido</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Tipo</label>
              <select {...register('type')} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm">
                <option value="fractioning">Fraccionamiento (1 insumo → unidades chicas)</option>
                <option value="elaboration">Elaboración (insumos → producto vendible)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Producto obtenido</label>
              <select {...register('output_product_id', { required: true })} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm">
                <option value="">Seleccionar...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.output_product_id && <p className="text-xs text-destructive mt-1">Requerido</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Cantidad por tanda</label>
              <input
                {...register('output_quantity', { required: true, min: 0.001 })}
                type="number" step="0.001"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Insumos {recipeType === 'elaboration' ? '(aprox. por tanda)' : 'consumidos por tanda'}
              </label>
              <button
                type="button"
                onClick={() => append({ product_id: '', quantity: 1 })}
                className="text-xs text-primary font-bold hover:underline"
              >
                + Agregar insumo
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <select
                    {...register(`items.${index}.product_id`, { required: true })}
                    className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  >
                    <option value="">Insumo...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input
                    {...register(`items.${index}.quantity`, { required: true, min: 0.001 })}
                    type="number" step="0.001"
                    className="w-24 px-3 py-2 bg-background border border-border rounded-xl text-sm"
                    placeholder="Cant."
                  />
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="p-2 text-destructive hover:bg-destructive/10 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <textarea
            {...register('notes')}
            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
            placeholder="Notas (opcional)"
            rows={2}
          />

          <button
            type="submit"
            disabled={createRecipe.isPending}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createRecipe.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar Receta
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RecipesTab() {
  const { data: recipes = [], isLoading } = useRecipes();
  const deleteRecipe = useDeleteRecipe();
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border">
        <p className="text-sm text-muted-foreground max-w-xl">
          Las recetas definen cuánto insumo consume <strong>aproximadamente</strong> cada tanda de producción.
          Sirven para precargar producciones y para calcular necesidades de insumos.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Receta
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : recipes.length === 0 ? (
        <div className="text-center p-16 bg-card border border-border rounded-2xl text-muted-foreground">
          <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No hay recetas definidas</p>
          <p className="text-sm mt-1">Creá una receta para fraccionar o elaborar productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map((recipe: Recipe) => (
            <div key={recipe.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${
                    recipe.type === 'fractioning'
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-500'
                  }`}>
                    {recipe.type === 'fractioning' ? <Scissors className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                    {recipe.type === 'fractioning' ? 'Fraccionamiento' : 'Elaboración'}
                  </div>
                  <h3 className="font-bold text-foreground">{recipe.name}</h3>
                </div>
                <button
                  onClick={() => deleteRecipe.mutate(recipe.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-xl"
                  title="Eliminar receta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-muted/30 rounded-xl p-3 text-sm space-y-1">
                <p className="font-semibold text-foreground">
                  Produce: {Number(recipe.output_quantity)} × {recipe.output_product?.name}
                </p>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-2">Consume (aprox.):</p>
                {recipe.items?.map((item) => (
                  <p key={item.id} className="text-xs text-muted-foreground">
                    • {Number(item.quantity)} × {item.product?.name}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && <RecipeModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
