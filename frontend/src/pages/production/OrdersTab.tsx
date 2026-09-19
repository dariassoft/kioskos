import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, X, Package, Loader2, ArrowDown, ArrowUp, Ban, Calculator } from 'lucide-react';
import {
  useProductionOrders,
  useCreateProductionOrder,
  useCancelProductionOrder,
  useRecipes,
  useProductionRequirements,
} from '@hooks/useProduction';
import { useProducts } from '@hooks/useInventory';
import { useBranchStore } from '@store/branch.store';
import type { ProductionOrder, Recipe } from '@api/production.types';
import type { Product } from '@api/inventory.types';

interface OrderForm {
  recipe_id: string;
  notes?: string;
  inputs: { product_id: string; quantity: number }[];
  outputs: { product_id: string; quantity: number; unit_cost?: number }[];
}

function ProductionModal({ onClose }: { onClose: () => void }) {
  const { data: productsPage } = useProducts({ limit: 500 });
  const products: Product[] = productsPage?.data ?? [];
  const { data: recipes = [] } = useRecipes();
  const createOrder = useCreateProductionOrder();
  const { activeBranch } = useBranchStore();

  const { register, handleSubmit, control, watch } = useForm<OrderForm>({
    defaultValues: {
      recipe_id: '',
      inputs: [{ product_id: '', quantity: 1 }],
      outputs: [{ product_id: '', quantity: 1 }],
    },
  });
  const inputs = useFieldArray({ control, name: 'inputs' });
  const outputs = useFieldArray({ control, name: 'outputs' });

  const selectedRecipeId = watch('recipe_id');
  const selectedRecipe: Recipe | undefined = recipes.find((r: Recipe) => r.id === selectedRecipeId);

  // Precargar insumos/output desde la receta seleccionada
  useEffect(() => {
    if (!selectedRecipe) return;
    inputs.replace(
      selectedRecipe.items.map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity) })),
    );
    outputs.replace([{
      product_id: selectedRecipe.output_product_id,
      quantity: Number(selectedRecipe.output_quantity),
    }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecipeId]);

  const onSubmit = (data: OrderForm) => {
    if (!activeBranch) return;
    createOrder.mutate({
      branch_id: activeBranch.id,
      recipe_id: data.recipe_id || undefined,
      notes: data.notes || undefined,
      inputs: data.inputs
        .filter((i) => i.product_id && Number(i.quantity) > 0)
        .map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity) })),
      outputs: data.outputs
        .filter((o) => o.product_id && Number(o.quantity) > 0)
        .map((o) => ({
          product_id: o.product_id,
          quantity: Number(o.quantity),
          ...(o.unit_cost ? { unit_cost: Number(o.unit_cost) } : {}),
        })),
    }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-3xl rounded-2xl p-6 shadow-xl border border-border animate-fade-in my-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Registrar Producción</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Descuenta insumos e incrementa el stock de los productos obtenidos en {activeBranch?.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              Receta base (opcional — precarga insumos y resultado)
            </label>
            <select {...register('recipe_id')} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm">
              <option value="">Producción manual (ej: desposte con rinde variable)</option>
              {recipes.map((r: Recipe) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.type === 'fractioning' ? 'Fraccionamiento' : 'Elaboración'})
                </option>
              ))}
            </select>
          </div>

          {/* INSUMOS */}
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-destructive uppercase tracking-widest flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> Insumos consumidos (reales)
              </label>
              <button type="button" onClick={() => inputs.append({ product_id: '', quantity: 1 })} className="text-xs text-primary font-bold hover:underline">
                + Agregar
              </button>
            </div>
            <div className="space-y-2">
              {inputs.fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <select {...register(`inputs.${index}.product_id`, { required: true })} className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-xl text-sm">
                    <option value="">Insumo...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input {...register(`inputs.${index}.quantity`, { required: true, min: 0.001 })} type="number" step="0.001" className="w-24 px-3 py-2 bg-background border border-border rounded-xl text-sm" placeholder="Cant." />
                  {inputs.fields.length > 1 && (
                    <button type="button" onClick={() => inputs.remove(index)} className="p-2 text-destructive hover:bg-destructive/10 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PRODUCTOS OBTENIDOS */}
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-green-600 dark:text-green-500 uppercase tracking-widest flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> Productos obtenidos (reales)
              </label>
              <button type="button" onClick={() => outputs.append({ product_id: '', quantity: 1 })} className="text-xs text-primary font-bold hover:underline">
                + Agregar
              </button>
            </div>
            <div className="space-y-2">
              {outputs.fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <select {...register(`outputs.${index}.product_id`, { required: true })} className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-xl text-sm">
                    <option value="">Producto...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input {...register(`outputs.${index}.quantity`, { required: true, min: 0.001 })} type="number" step="0.001" className="w-24 px-3 py-2 bg-background border border-border rounded-xl text-sm" placeholder="Cant." />
                  <input {...register(`outputs.${index}.unit_cost`)} type="number" step="0.01" className="w-28 px-3 py-2 bg-background border border-border rounded-xl text-sm" placeholder="Costo $ (auto)" title="Costo unitario — vacío = prorrateo automático" />
                  {outputs.fields.length > 1 && (
                    <button type="button" onClick={() => outputs.remove(index)} className="p-2 text-destructive hover:bg-destructive/10 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground">
                Si el costo queda vacío, se prorratea automáticamente el costo total de los insumos entre las cantidades producidas.
              </p>
            </div>
          </div>

          <textarea {...register('notes')} className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm" placeholder="Notas (opcional)" rows={2} />

          <button type="submit" disabled={createOrder.isPending || !activeBranch} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {createOrder.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Registrar Producción
          </button>
        </form>
      </div>
    </div>
  );
}

function RequirementsCalculator() {
  const { data: recipes = [] } = useRecipes();
  const [outputProductId, setOutputProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { data, isFetching, isError } = useProductionRequirements(outputProductId, quantity, !!outputProductId);

  const recipeOptions = recipes.filter((r: Recipe) => r.output_product);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-bold flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-primary" />
        Calculadora de insumos (estimado)
      </h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={outputProductId}
          onChange={(e) => setOutputProductId(e.target.value)}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm"
        >
          <option value="">Producto con receta...</option>
          {recipeOptions.map((r: Recipe) => (
            <option key={r.id} value={r.output_product_id}>{r.output_product?.name} — {r.name}</option>
          ))}
        </select>
        <input
          type="number" min={0.001} step="0.001"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full sm:w-28 px-3 py-2 bg-background border border-border rounded-xl text-sm"
          placeholder="Cant."
        />
      </div>
      {isFetching && <p className="text-xs text-muted-foreground mt-2">Calculando...</p>}
      {isError && <p className="text-xs text-destructive mt-2">Este producto no tiene receta activa</p>}
      {data && !isFetching && (
        <div className="mt-3 bg-muted/30 rounded-xl p-3 text-sm space-y-1">
          <p className="font-semibold">Para producir {data.desired_quantity} se estima:</p>
          {data.estimated_inputs.map((i: { product_id: string; product_name: string; estimated_quantity: number }) => (
            <p key={i.product_id} className="text-xs text-muted-foreground">
              • {i.product_name}: <strong>{i.estimated_quantity.toLocaleString('es-AR', { maximumFractionDigits: 3 })}</strong>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersTab() {
  const { activeBranch } = useBranchStore();
  const { data: orders = [], isLoading } = useProductionOrders(activeBranch?.id);
  const cancelOrder = useCancelProductionOrder();
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border">
        <p className="text-sm text-muted-foreground max-w-xl">
          Registrá fraccionamientos y elaboraciones. El stock de insumos es un
          <strong> seguimiento aproximado</strong> (puede quedar negativo si la compra no fue cargada).
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Producción
        </button>
      </div>

      <RequirementsCalculator />

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : orders.length === 0 ? (
        <div className="text-center p-16 bg-card border border-border rounded-2xl text-muted-foreground">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No hay producciones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: ProductionOrder) => {
            const isCancelled = order.status === 'cancelled';
            return (
              <div key={order.id} className={`bg-card border border-border rounded-2xl p-5 ${isCancelled ? 'opacity-60' : ''}`}>
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isCancelled ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-500'
                      }`}>
                        {isCancelled ? 'Cancelada' : 'Completada'}
                      </span>
                      {order.recipe && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                          {order.recipe.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {new Date(order.created_at).toLocaleString('es-AR')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-muted/30 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Consumió</p>
                        {order.inputs?.map((i) => (
                          <p key={i.id} className="text-xs">− {Number(i.quantity)} × {i.product?.name}</p>
                        ))}
                      </div>
                      <div className="bg-muted/30 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Produjo</p>
                        {order.outputs?.map((o) => (
                          <p key={o.id} className="text-xs">+ {Number(o.quantity)} × {o.product?.name} (${Number(o.unit_cost).toLocaleString('es-AR', { minimumFractionDigits: 2 })} c/u)</p>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-end justify-between gap-2">
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Costo insumos</p>
                      <p className="text-lg font-extrabold text-primary">
                        ${Number(order.total_input_cost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {!isCancelled && (
                      <button
                        onClick={() => cancelOrder.mutate(order.id)}
                        disabled={cancelOrder.isPending}
                        className="px-3 py-2 text-xs font-bold text-destructive border border-destructive/30 rounded-xl hover:bg-destructive/10 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <Ban className="w-3 h-3" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && <ProductionModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
