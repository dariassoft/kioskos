import { useState } from 'react';
import { Package, Search, Plus, CheckCircle2, Factory } from 'lucide-react';
import { useOrders, useReceiveOrder } from '@hooks/usePurchases';
import { useBranchStore } from '@store/branch.store';
// import { useProducts } from '@hooks/useInventory'; // Asumiento que se haría para crear orden..
import type { PurchaseOrder } from '@api/purchases.types';

function CreatePOModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl p-6 shadow-xl border border-border animate-fade-in text-center">
        <Package className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Crear Orden de Compra</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Para simplificar la demo, hemos saltado el formulario complejo de carrito de compras.
        </p>
        <button onClick={onClose} className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-sm hover:bg-primary/90">
          Cerrar
        </button>
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
          <button
            onClick={() => setModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva O.C.
          </button>
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
      
      <CreatePOModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
