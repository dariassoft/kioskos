import { useEffect, useState } from 'react';
import { Package, Search, Plus, CheckCircle2, Factory, Sparkles, Trash2, LayoutGrid, List, Eye, Edit2, RotateCcw, X } from 'lucide-react';
import { useOrders, useReceiveOrder, useCreateOrder, useUpdateOrder, useSuppliers, useCreatePurchasePayment, useCreatePurchaseReturn } from '@hooks/usePurchases';
import { useProducts } from '@hooks/useInventory';
import { useBranchStore } from '@store/branch.store';
import ReplenishmentAssistant from '@components/ReplenishmentAssistant';
import type { PurchaseOrder, Supplier, PurchaseReturnSettlement } from '@api/purchases.types';

function CreatePOModal({ isOpen, onClose, suggested = [], existing, receiveMode = false }: { isOpen: boolean, onClose: () => void, suggested?: { product_id: string; quantity: number; unit_cost: number }[], existing?: PurchaseOrder | null, receiveMode?: boolean }) {
  const { activeBranch } = useBranchStore(); const { data: suppliers = [] } = useSuppliers(); const { data: products } = useProducts({ page: 1, limit: 200 }); const createOrder = useCreateOrder(); const updateOrder = useUpdateOrder(); const receiveOrder = useReceiveOrder()
  const [supplierId, setSupplierId] = useState(existing?.supplier_id || ''); const [items, setItems] = useState<{ product_id: string; quantity: number; unit_cost: number; vat_rate?: number }[]>(existing?.items?.map(item => ({ product_id: item.product_id, quantity: Number(item.quantity), unit_cost: Number(item.unit_cost), vat_rate: item.vat_rate })) || suggested); const [productId, setProductId] = useState(''); const [quantity, setQuantity] = useState(1); const [unitCost, setUnitCost] = useState(0)
  useEffect(() => { if (isOpen) { setSupplierId(existing?.supplier_id || ''); setItems(existing?.items?.map(item => ({ product_id: item.product_id, quantity: Number(item.quantity), unit_cost: Number(item.unit_cost), vat_rate: item.vat_rate })) || suggested); } }, [isOpen, existing, suggested]);
  if (!isOpen) return null;
  const addItem = () => { if (!productId || quantity <= 0 || unitCost < 0) return; setItems([...items, { product_id: productId, quantity, unit_cost: unitCost }]); setProductId(''); setQuantity(1); setUnitCost(0) }
  const submit = () => { if (!supplierId || !(existing?.branch_id || activeBranch?.id) || !items.length) return; const data = { supplier_id: supplierId, branch_id: existing?.branch_id || activeBranch!.id, items }; if (existing) { if (receiveMode) receiveOrder.mutate({ id: existing.id, data }, { onSuccess: onClose }); else updateOrder.mutate({ id: existing.id, data }, { onSuccess: onClose }); } else createOrder.mutate(data, { onSuccess: onClose }) }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl p-6 shadow-xl border border-border animate-fade-in text-center">
        <Package className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">{receiveMode ? 'Confirmar recepción real' : existing ? 'Editar Orden de Compra' : 'Crear Orden de Compra'}</h2>
        <label className="block text-left text-sm font-medium mb-1">Proveedor</label>
        <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-3 bg-background border border-border rounded-xl mb-4"><option value="">Seleccionar proveedor...</option>{suppliers.map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <div className="rounded-xl border border-border bg-muted/20 p-3 mb-4 text-left">
          <p className="text-sm font-semibold mb-2">Agregar producto a la orden</p>
          <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full p-3 bg-background border border-border rounded-xl mb-3"><option value="">Seleccionar producto...</option>{products?.data?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end"><label className="text-xs text-muted-foreground">Cantidad<input type="number" min="0.01" step="0.01" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="mt-1 w-full p-3 bg-background border border-border rounded-xl" /></label><label className="text-xs text-muted-foreground">Costo neto unitario<input type="number" min="0" step="0.01" value={unitCost} onChange={e => setUnitCost(Number(e.target.value))} className="mt-1 w-full p-3 bg-background border border-border rounded-xl" /></label><button onClick={addItem} disabled={!productId || quantity <= 0} className="p-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-50" aria-label="Agregar producto"><Plus className="w-5 h-5" /></button></div>
          <p className="text-xs text-muted-foreground mt-2">El costo ingresado es neto, sin IVA. El total estimado incluye el IVA configurado en cada producto.</p>
        </div>
        <div className="text-left max-h-36 overflow-auto mb-4 space-y-2">{items.length === 0 ? <p className="text-sm text-muted-foreground text-center py-3">Todavía no agregaste productos.</p> : items.map((item, i) => <div key={i} className="text-sm flex items-center gap-2 rounded-lg bg-muted/30 p-2"><span className="flex-1">{products?.data?.find(p => p.id === item.product_id)?.name || 'Producto'}<span className="block text-xs text-muted-foreground">{item.quantity} × ${item.unit_cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></span><b>${(item.quantity * item.unit_cost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</b><button onClick={() => setItems(items.filter((_, index) => index !== i))} className="p-1 text-destructive" aria-label="Quitar producto"><Trash2 className="w-4 h-4" /></button></div>)}</div>
        <div className="flex justify-between border-t border-border pt-3 mb-4 font-bold"><span>Total estimado (final)</span><span className="text-primary">${items.reduce((total, item) => { const vat = item.vat_rate ?? products?.data?.find(p => p.id === item.product_id)?.vat_rate ?? 0; return total + item.quantity * item.unit_cost * (1 + Number(vat) / 100); }, 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 px-5 py-2.5 border rounded-xl">Cancelar</button><button disabled={!supplierId || !items.length || createOrder.isPending || updateOrder.isPending || receiveOrder.isPending} onClick={submit} className="flex-1 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl">{receiveMode ? 'Confirmar recepción' : existing ? 'Guardar cambios' : 'Crear orden'}</button></div>
      </div>
    </div>
  );
}

function PurchaseReturnModal({ order, onClose }: { order: PurchaseOrder; onClose: () => void }) {
  const createReturn = useCreatePurchaseReturn();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [settlement, setSettlement] = useState<PurchaseReturnSettlement>('credit_note');
  const items = (order.items || []).filter((item) => Number(item.quantity) > 0);
  const submit = () => {
    const returnItems = items.filter((item) => Number(quantities[item.product_id] || 0) > 0).map((item) => ({ product_id: item.product_id, quantity: Number(quantities[item.product_id]) }));
    if (!returnItems.length || !reason.trim()) return;
    createReturn.mutate({ id: order.id, data: { items: returnItems, reason: reason.trim(), settlement_method: settlement } }, { onSuccess: onClose });
  };
  return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
    <div className="bg-card rounded-2xl p-6 w-full max-w-lg space-y-4 border border-border">
      <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Devolver mercadería</h2><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <p className="text-sm text-muted-foreground">Indica las cantidades que realmente se devuelven. El stock y la cuenta del proveedor se ajustarán automáticamente.</p>
      <div className="space-y-2 max-h-56 overflow-y-auto">{items.map((item) => <label key={item.product_id} className="flex items-center gap-3 border-b border-border pb-2"><span className="flex-1 text-sm">{item.product?.name || item.product_id.slice(0, 8)}<small className="block text-muted-foreground">Máximo: {item.quantity}</small></span><input type="number" min="0" max={Number(item.quantity)} step="0.01" value={quantities[item.product_id] || ''} onChange={(e) => setQuantities({ ...quantities, [item.product_id]: Number(e.target.value) })} className="w-24 p-2 bg-background border border-border rounded-lg" /></label>)}</div>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo de la devolución" className="w-full p-3 bg-background border border-border rounded-xl" />
      <select value={settlement} onChange={(e) => setSettlement(e.target.value as PurchaseReturnSettlement)} className="w-full p-3 bg-background border border-border rounded-xl"><option value="credit_note">Nota de crédito / saldo a favor</option><option value="cash_refund">Devolución de dinero en efectivo</option><option value="bank_refund">Devolución a banco</option></select>
      <div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 border rounded-xl">Cancelar</button><button onClick={submit} disabled={createReturn.isPending} className="flex-1 py-2 bg-destructive text-white rounded-xl font-bold">Confirmar devolución</button></div>
    </div>
  </div>;
}

export default function OrdersTab() {
  const { data: orders = [], isLoading } = useOrders();
  const receiveOrder = useReceiveOrder();
  const { activeBranch } = useBranchStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<{ product_id: string; quantity: number; unit_cost: number }[]>([]);
  const [payingOrder, setPayingOrder] = useState<PurchaseOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'bank'>('cash');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [returningOrder, setReturningOrder] = useState<PurchaseOrder | null>(null);
  const createPayment = useCreatePurchasePayment();

  // Filtrar por sucursal actual y búsqueda local (ej: prov o total)
  const branchOrders = orders.filter((o: PurchaseOrder) => o.branch_id === activeBranch?.id && (o.id.toLowerCase().includes(search.toLowerCase()) || o.supplier?.name?.toLowerCase().includes(search.toLowerCase())));
  
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
            <div className="flex rounded-xl border border-border p-1 bg-background">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}`} aria-label="Vista grilla"><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`} aria-label="Vista listado"><List className="w-4 h-4" /></button>
            </div>
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
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
          {branchOrders.map((order: PurchaseOrder) => {
            const isReceived = order.status === 'received';
            const isCancelled = order.status === 'cancelled';
            const isPending = order.status === 'pending';
            const isPaid = order.payment_status === 'paid';
            const paidAmount = Number(order.paid_amount || 0);

            return (
              <div key={order.id} className={`bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-wrap items-center gap-4'}`}>
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

                 <div className="flex-1 bg-muted/30 rounded-xl p-3 mb-4 flex justify-between items-center min-w-40">
                    <div>
                      <p className="text-xs text-muted-foreground">Costo Total</p>
                      <p className="text-lg font-extrabold text-primary">${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                    </div>
                 </div>

                 {isPending && (
                   <button
                    onClick={() => setReceivingOrder(order)}
                    disabled={receiveOrder.isPending}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                   >
                     <CheckCircle2 className="w-4 h-4" />
                     Marcar como Recibida
                   </button>
                 )}
                 {isPending && <button onClick={() => setEditingOrder(order)} className="w-full py-2 text-sm border border-border rounded-xl flex items-center justify-center gap-2"><Edit2 className="w-4 h-4" /> Editar orden</button>}
                 {isReceived && (
                   <div className="space-y-2 min-w-48"><p className="text-xs text-muted-foreground">Pagado: <b>${paidAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</b> / ${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>{!isPaid ? <button onClick={() => { setPayingOrder(order); setPaymentAmount(Number(order.total) - paidAmount); }} className="w-full py-2.5 text-sm font-bold text-primary bg-primary/10 rounded-xl">Registrar pago al proveedor</button> : <p className="w-full py-2.5 text-center text-sm font-bold text-green-600 bg-green-500/10 rounded-xl">Orden pagada</p>}<button onClick={() => setReturningOrder(order)} className="w-full py-2.5 text-sm font-bold text-destructive bg-destructive/10 rounded-xl flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /> Registrar devolución</button><p className="w-full py-2 text-center text-xs font-semibold text-muted-foreground bg-accent/50 rounded-xl flex items-center justify-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-green-500"/>
                     Stock ingresado; pago independiente
                   </p></div>
                 )}
                 <button onClick={() => setDetailOrder(order)} className="w-full py-2 text-sm border border-border rounded-xl flex items-center justify-center gap-2"><Eye className="w-4 h-4" /> Ver detalle</button>
              </div>
            );
          })}
        </div>
      )}
      
       <CreatePOModal isOpen={isModalOpen} suggested={suggestedItems} onClose={() => setModalOpen(false)} />
       <CreatePOModal isOpen={Boolean(editingOrder)} existing={editingOrder} onClose={() => setEditingOrder(null)} />
       <CreatePOModal isOpen={Boolean(receivingOrder)} existing={receivingOrder} receiveMode onClose={() => setReceivingOrder(null)} />
       <ReplenishmentAssistant isOpen={isAssistantOpen} onClose={() => setAssistantOpen(false)} onGenerate={(items) => { setSuggestedItems(items); setModalOpen(true) }} />
       {payingOrder && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-4"><h2 className="text-xl font-bold">Registrar pago a proveedor</h2><p className="text-sm text-muted-foreground">Orden #{payingOrder.id.slice(0, 8)} · Total ${Number(payingOrder.total).toLocaleString('es-AR')}</p><label className="block text-sm">Importe<input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className="mt-1 w-full p-3 bg-background border border-border rounded-xl" /></label><label className="block text-sm">Medio<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as typeof paymentMethod)} className="mt-1 w-full p-3 bg-background border border-border rounded-xl"><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="bank">Banco</option></select></label><div className="flex gap-2"><button onClick={() => setPayingOrder(null)} className="flex-1 py-2 border rounded-xl">Cancelar</button><button disabled={paymentAmount <= 0 || createPayment.isPending} onClick={() => createPayment.mutate({ id: payingOrder.id, amount: paymentAmount, payment_method: paymentMethod }, { onSuccess: () => setPayingOrder(null) })} className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl">Guardar pago</button></div></div></div>}
       {detailOrder && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="bg-card rounded-2xl p-6 w-full max-w-lg space-y-4"><div className="flex justify-between"><h2 className="text-xl font-bold">Detalle de orden</h2><button onClick={() => setDetailOrder(null)} className="text-muted-foreground"><X className="w-5 h-5" /></button></div><p className="text-sm text-muted-foreground">Orden #{detailOrder.id.slice(0, 8).toUpperCase()} · {detailOrder.supplier?.name || 'Proveedor'} · {new Date(detailOrder.created_at).toLocaleDateString('es-AR')}</p><div className="space-y-2 max-h-64 overflow-auto">{(detailOrder.items || []).map((item, index) => <div key={item.id || index} className="flex justify-between border-b border-border pb-2"><span>{item.product?.name || `Producto ${item.product_id.slice(0, 8)}`}<small className="block text-muted-foreground">{item.quantity} × ${Number(item.unit_cost).toLocaleString('es-AR')}</small></span><b>${Number(item.subtotal).toLocaleString('es-AR')}</b></div>)}</div><div className="flex justify-between font-bold border-t border-border pt-3"><span>Total</span><span>${Number(detailOrder.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>{detailOrder.status === 'received' && <button onClick={() => { setReturningOrder(detailOrder); setDetailOrder(null) }} className="w-full py-2 bg-destructive/10 text-destructive rounded-xl font-bold">Registrar devolución</button>}<button onClick={() => setDetailOrder(null)} className="w-full py-2 border rounded-xl">Cerrar</button></div></div>}
       {returningOrder && <PurchaseReturnModal order={returningOrder} onClose={() => setReturningOrder(null)} />}
    </div>
  );
}
