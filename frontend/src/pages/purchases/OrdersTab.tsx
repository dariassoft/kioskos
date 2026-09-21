import { useState } from 'react';
import { Package, Search, Plus, CheckCircle2, Factory, Sparkles, Trash2 } from 'lucide-react';
import { useOrders, useReceiveOrder, useCreateOrder, useSuppliers } from '@hooks/usePurchases';
import { useProducts } from '@hooks/useInventory';
import { useBranchStore } from '@store/branch.store';
import ReplenishmentAssistant from '@components/ReplenishmentAssistant';
import type { PurchaseOrder, Supplier } from '@api/purchases.types';

function CreatePOModal({ isOpen, onClose, suggested = [] }: { isOpen: boolean, onClose: () => void, suggested?: { product_id: string; quantity: number; unit_cost: number }[] }) {
  const { activeBranch } = useBranchStore(); const { data: suppliers = [] } = useSuppliers(); const { data: products } = useProducts({ page: 1, limit: 200 }); const createOrder = useCreateOrder()
  const [supplierId, setSupplierId] = useState(''); const [items, setItems] = useState(suggested); const [productId, setProductId] = useState(''); const [quantity, setQuantity] = useState(1); const [unitCost, setUnitCost] = useState(0)
  if (!isOpen) return null;
  const addItem = () => { if (!productId || quantity <= 0 || unitCost < 0) return; setItems([...items, { product_id: productId, quantity, unit_cost: unitCost }]); setProductId(''); setQuantity(1); setUnitCost(0) }
  const submit = () => { if (!supplierId || !activeBranch?.id || !items.length) return; createOrder.mutate({ supplier_id: supplierId, branch_id: activeBranch.id, items }, { onSuccess: onClose }) }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl p-6 shadow-xl border border-border animate-fade-in text-center">
        <Package className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Crear Orden de Compra</h2>
        <label className="block text-left text-sm font-medium mb-1">Proveedor</label>
        <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-3 bg-background border border-border rounded-xl mb-4"><option value="">Seleccionar proveedor...</option>{suppliers.map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <div className="rounded-xl border border-border bg-muted/20 p-3 mb-4 text-left">
          <p className="text-sm font-semibold mb-2">Agregar producto a la orden</p>
          <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full p-3 bg-background border border-border rounded-xl mb-3"><option value="">Seleccionar producto...</option>{products?.data?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end"><label className="text-xs text-muted-foreground">Cantidad<input type="number" min="0.01" step="0.01" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="mt-1 w-full p-3 bg-background border border-border rounded-xl" /></label><label className="text-xs text-muted-foreground">Costo unitario<input type="number" min="0" step="0.01" value={unitCost} onChange={e => setUnitCost(Number(e.target.value))} className="mt-1 w-full p-3 bg-background border border-border rounded-xl" /></label><button onClick={addItem} disabled={!productId || quantity <= 0} className="p-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-50" aria-label="Agregar producto"><Plus className="w-5 h-5" /></button></div>
          <p className="text-xs text-muted-foreground mt-2">El costo unitario es el precio que pagarás al proveedor por cada unidad.</p>
        </div>
        <div className="text-left max-h-36 overflow-auto mb-4 space-y-2">{items.length === 0 ? <p className="text-sm text-muted-foreground text-center py-3">Todavía no agregaste productos.</p> : items.map((item, i) => <div key={i} className="text-sm flex items-center gap-2 rounded-lg bg-muted/30 p-2"><span className="flex-1">{products?.data?.find(p => p.id === item.product_id)?.name || 'Producto'}<span className="block text-xs text-muted-foreground">{item.quantity} × ${item.unit_cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></span><b>${(item.quantity * item.unit_cost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</b><button onClick={() => setItems(items.filter((_, index) => index !== i))} className="p-1 text-destructive" aria-label="Quitar producto"><Trash2 className="w-4 h-4" /></button></div>)}</div>
        <div className="flex justify-between border-t border-border pt-3 mb-4 font-bold"><span>Total estimado</span><span className="text-primary">${items.reduce((total, item) => total + item.quantity * item.unit_cost, 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 px-5 py-2.5 border rounded-xl">Cancelar</button><button disabled={!supplierId || !items.length || createOrder.isPending} onClick={submit} className="flex-1 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl">Crear orden</button></div>
      </div>
    </div>
  );
}

export default function OrdersTab() {
  const { data: orders = [], isLoading } = useOrders();
  const receiveOrder = useReceiveOrder();
  const { activeBranch } = useBranchStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<{ product_id: string; quantity: number; unit_cost: number }[]>([]);

  // Filtrar por sucursal actual y búsqueda local (ej: prov o total)
  const branchOrders = orders.filter((o: PurchaseOrder) => o.branch_id === activeBranch?.id);
  
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar NS Orden..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAssistantOpen(true)}
              className="px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600/20 shadow-sm border border-indigo-200/50 transition-all dark:border-indigo-800/50 animate-pulse hover:animate-none"
            >
              <Sparkles className="w-4 h-4" />
              Asistente IA
            </button>
            <button
               onClick={() => { setSuggestedItems([]); setModalOpen(true) }}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva O.C.
            </button>
          </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : branchOrders.length === 0 ? (
        <div className="text-center p-16 bg-card border border-border rounded-2xl text-muted-foreground">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No hay órdenes de compra en esta sucursal</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branchOrders.map((order: PurchaseOrder) => {
            const isReceived = order.status === 'received';
            const isCancelled = order.status === 'cancelled';
            const isPending = order.status === 'pending';

            return (
              <div key={order.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col">
                 <div className="flex justify-between items-start mb-3">
                   <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(0,8).toUpperCase()}</span>
                      <h3 className="font-bold text-foreground mt-1 flex items-center gap-1.5 line-clamp-1">
                        <Factory className="w-4 h-4 text-muted-foreground" />
                        {order.supplier?.name || 'Prov. Desconocido'}
                      </h3>
                   </div>
                   <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                     isReceived ? 'bg-green-500/10 text-green-500' :
                     isCancelled ? 'bg-destructive/10 text-destructive' :
                     'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
                   }`}>
                     {isReceived ? 'Recibida' : isCancelled ? 'Cancelada' : 'Pendiente'}
                   </div>
                 </div>

                 <div className="flex-1 bg-muted/30 rounded-xl p-3 mb-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Costo Total</p>
                      <p className="text-lg font-extrabold text-primary">${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                    </div>
                 </div>

                 {isPending && (
                   <button
                    onClick={() => receiveOrder.mutate(order.id)}
                    disabled={receiveOrder.isPending}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                   >
                     <CheckCircle2 className="w-4 h-4" />
                     Marcar como Recibida
                   </button>
                 )}
                 {isReceived && (
                   <p className="w-full py-2.5 text-center text-sm font-semibold text-muted-foreground bg-accent/50 rounded-xl flex items-center justify-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-green-500"/>
                     Stock ya ingresado
                   </p>
                 )}
              </div>
            );
          })}
        </div>
      )}
      
       <CreatePOModal isOpen={isModalOpen} suggested={suggestedItems} onClose={() => setModalOpen(false)} />
       <ReplenishmentAssistant isOpen={isAssistantOpen} onClose={() => setAssistantOpen(false)} onGenerate={(items) => { setSuggestedItems(items); setModalOpen(true) }} />
    </div>
  );
}
