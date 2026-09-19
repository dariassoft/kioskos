import { useState } from 'react';
import { Scissors, ChefHat } from 'lucide-react';
import OrdersTab from './OrdersTab';
import RecipesTab from './RecipesTab';

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'recipes'>('orders');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Producción</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Fraccionamiento de productos a granel y elaboración de productos a partir de insumos
          </p>
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
            <Scissors className="w-4 h-4" />
            Producciones
          </div>
          {activeTab === 'orders' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`pb-3 text-sm font-semibold relative transition-colors ${
            activeTab === 'recipes' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2 px-2">
            <ChefHat className="w-4 h-4" />
            Recetas
          </div>
          {activeTab === 'recipes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === 'orders' ? <OrdersTab /> : <RecipesTab />}
    </div>
  );
}
