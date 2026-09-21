import { useState } from 'react';
import { Package, Search, Plus, CheckCircle2, Factory, Sparkles } from 'lucide-react';
import { useOrders, useReceiveOrder, useCreateOrder, useSuppliers } from '@hooks/usePurchases';
import { useProducts } from '@hooks/useInventory';
import { useBranchStore } from '@store/branch.store';
import ReplenishmentAssistant from '@components/ReplenishmentAssistant';
import type { PurchaseOrder } from '@api/purchases.types';

function CreatePOModal({ isOpen, onClose, suggested = [] }: { isOpen: boolean, onClose: () => void, suggested?: { product_id: string; quantity: number; unit_cost: number }[] }) {
  const { activeBranch } = useBranchStore(); const { data: suppliers = [] } = useSuppliers(); const { data: products } = useProducts({ page: 1, limit: 200 }); const createOrder = useCreateOrder()
  const [supplierId, setSupplierId] = useState(''); const [items, setItems] = useState(suggested); const [productId, setProductId] = useState(''); const [quantity, setQuantity] = useState(1); const [unitCost, setUnitCost] = useState(0)
  if (!isOpen) return null;
  const addItem = () => { if (!productId || quantity <= 0) return; setItems([...items, { product_id: productId, quantity, unit_cost: unitCost }]); setProductId('') }
  const submit = () => { if (!supplierId || !activeBranch?.id || !items.length) return; createOrder.mutate({ supplier_id: supplierId, branch_id: activeBranch.id, items }, { onSuccess: onClose }) }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl p-6 shadow-xl border border-border animate-fade-in text-center">
        <Package className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Crear Orden de Compra</h2>
        <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-2 border rounded-lg mb-3"><option value="">Seleccionar proveedor</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <div className="flex gap-2 mb-3"><select value={productId} onChange={e => setProductId(e.target.value)} className="flex-1 p-2 border rounded-lg"><option value="">Agregar producto</option>{products?.data?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-20 p-2 border rounded-lg" placeholder="Cant." /><input type="number" min="0" value={unitCost} onChange={e => setUnitCost(Number(e.target.value))} className="w-24 p-2 border rounded-lg" placeholder="Costo" /><button onClick={addItem} className="px-3 bg-accent rounded-lg">+</button></div>
        <div className="text-left max-h-32 overflow-auto mb-4">{items.map((item, i) => <div key={i} className="text-sm flex justify-between py-1"><span>{products?.data?.find(p => p.id === item.product_id)?.name || 'Producto'} x {item.quantity}</span><span>${item.quantity * item.unit_cost}</span></div>)}</div>
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
