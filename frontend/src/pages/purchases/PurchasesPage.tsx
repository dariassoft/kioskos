import { useState } from 'react';
import { 
  Package, Factory
} from 'lucide-react';
import SuppliersTab from './SuppliersTab';
import OrdersTab from './OrdersTab';

export default function PurchasesPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Compras y Proveedores</h1>
            <p className="text-muted-foreground mt-1 text-sm">Gestiona el reabastecimiento de stock</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border pb-px">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-sm font-semibold relative transition-colors ${
              activeTab === 'orders' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2 px-2">
              <Package className="w-4 h-4" />
              Órdenes de Compra
            </div>
            {activeTab === 'orders' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`pb-3 text-sm font-semibold relative transition-colors ${
              activeTab === 'suppliers' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2 px-2">
              <Factory className="w-4 h-4" />
              Proveedores
            </div>
            {activeTab === 'suppliers' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'orders' ? <OrdersTab /> : <SuppliersTab />}
        
      </div>
    </>
  );
}
