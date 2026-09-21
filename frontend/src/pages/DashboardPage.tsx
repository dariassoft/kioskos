import { useState } from 'react';
import { useAuthStore } from '@store/auth.store';
import { useBranchStore } from '@store/branch.store';
import { 
  TrendingUp, ShoppingBag, Package, Users, ArrowUpRight, BarChart3, Database, CalendarDays, X, RotateCcw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  useDashboardMetrics,
  useWeeklyChart,
  useTopProducts,
  useInventoryValuation
  ,useSalesByDate
} from '@hooks/useReports';
import { useCreateSaleReturn } from '@hooks/useSales';
import type { Sale } from '@api/sales.types';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { activeBranch } = useBranchStore();

  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics(activeBranch?.id);
  const { data: weeklyData = [], isLoading: loadingWeekly } = useWeeklyChart(activeBranch?.id);
  const { data: topProducts = [], isLoading: loadingTop } = useTopProducts(activeBranch?.id);
  const { data: valuation, isLoading: loadingValuation } = useInventoryValuation(activeBranch?.id);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState('');
  const { data: selectedSales } = useSalesByDate(selectedDate, activeBranch?.id);
  const [returnSale, setReturnSale] = useState<Sale | null>(null);

  // Formateadores
  const currencyFormatter = (value: number) => `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  const localDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const dateFormatter = (dateStr: string) => {
    // Las fechas del gráfico son días calendario, no instantes UTC.
    // Crear la fecha en local evita que Argentina retroceda un día.
    const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-sm">
          <p className="font-bold text-foreground mb-1">{payload[0].name}</p>
          <p className="text-muted-foreground">Vendidos: <span className="font-semibold text-foreground">{payload[0].value}</span></p>
          <p className="text-muted-foreground">Ingresos: <span className="font-semibold text-primary">{currencyFormatter(payload[0].payload.revenue)}</span></p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-sm">
          <p className="font-bold text-foreground mb-1">{dateFormatter(label)}</p>
          <p className="text-muted-foreground flex items-center justify-between gap-4">
             Ingresos: <span className="font-extrabold text-primary">{currencyFormatter(payload[0].value)}</span>
          </p>
          <p className="text-muted-foreground flex items-center justify-between gap-4">
             Tickets: <span className="font-bold text-foreground">{payload[0].payload.tickets}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bienvenido, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aquí está el rendimiento de {activeBranch ? `la sucursal ${activeBranch.name}` : 'todas las sucursales'}.
          </p>
        </div>
      </div>

      {/* Stats cards (Métricas Principales) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Ventas Hoy */}
         <div role="button" tabIndex={0} onClick={() => setSelectedDate(localDateString())} className="stat-card text-left hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
         </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hoy</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground mt-2">
              {loadingMetrics ? '...' : currencyFormatter(metrics?.sales_today || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Ingresos de hoy</p>
          </div>
        </div>

        {/* Tickets Hoy */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hoy</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground mt-2">
              {loadingMetrics ? '...' : metrics?.tickets_today || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Transacciones procesadas</p>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hoy</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground mt-2">
              {loadingMetrics ? '...' : currencyFormatter(metrics?.avg_ticket || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Ticket Promedio</p>
          </div>
        </div>

        {/* Ventas del mes */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-violet-500" />
            </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mes actual</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground mt-2">
              {loadingMetrics ? '...' : currencyFormatter(metrics?.sales_month || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Ingresos del mes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Ventas Semanales */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <h2 className="text-lg font-bold">Ventas de los últimos 7 días</h2>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>Ver fecha</span>
                <input type="date" value={calendarDate} onChange={(event) => { setCalendarDate(event.target.value); setSelectedDate(event.target.value || null); }} className="rounded-lg border border-border bg-background px-2 py-1 text-foreground" />
              </label>
          </div>
          <div className="flex-1 min-h-[300px]">
            {loadingWeekly ? (
               <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : weeklyData.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                 <BarChart3 className="w-12 h-12 mb-3" />
                 <p>No hay datos de ventas en este rango</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={weeklyData} onClick={(state: any) => { const date = state?.activePayload?.[0]?.payload?.date; if (date) setSelectedDate(date); }} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/50" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={dateFormatter} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor', fontSize: 12 }} 
                    className="text-muted-foreground"
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={(val) => `$${val/1000}k`} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.4 }} />
                  <Bar 
                    dataKey="total" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={50}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
       {selectedDate && (
         <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
           <div className="bg-card rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-auto space-y-4">
             <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Ventas del {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-AR')}</h2><p className="text-sm text-muted-foreground">{selectedSales?.total || 0} ventas registradas</p></div><button type="button" onClick={() => setSelectedDate(null)} aria-label="Cerrar"><X className="w-5 h-5" /></button></div>
             {!selectedSales ? <p className="py-8 text-center text-muted-foreground">Cargando ventas...</p> : selectedSales.data.length === 0 ? <p className="py-8 text-center text-muted-foreground">No hay ventas para esta fecha.</p> : <div className="space-y-2">{selectedSales.data.map((sale: Sale) => <div key={sale.id} className="border border-border rounded-xl p-3 flex justify-between gap-4"><div><p className="font-semibold">Venta #{sale.id.slice(0, 8).toUpperCase()}</p><p className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · {sale.payment_method}</p><p className="text-xs text-muted-foreground">{sale.items?.length || 0} artículo(s)</p></div><div className="text-right"><p className="font-bold text-primary">{currencyFormatter(Number(sale.total))}</p>{sale.status !== 'refunded' && <button onClick={() => setReturnSale(sale)} className="mt-1 text-xs text-destructive font-bold inline-flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Devolver</button>}</div></div>)}</div>}
             <button type="button" onClick={() => setSelectedDate(null)} className="w-full py-2 border border-border rounded-xl">Cerrar</button>
           </div>
         </div>
      )}
      {returnSale && <SaleReturnModal sale={returnSale} onClose={() => setReturnSale(null)} />}
     </div>
        </div>

        {/* Top Productos (Dona) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold mb-6 text-center">Top 5 Productos Muy Vendidos</h2>
          <div className="flex-1 min-h-[250px] relative">
            {loadingTop ? (
              <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : topProducts.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                 <Package className="w-12 h-12 mb-3" />
                 <p>No hay ventas registradas</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProducts}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1000}
                  >
                    {Array.isArray(topProducts) && topProducts.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-medium text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {/* Center Text Trick */}
            {!loadingTop && topProducts.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 text-center">
                 <span className="text-xs text-muted-foreground">Totales</span>
                 <span className="text-2xl font-extrabold text-foreground leading-none mt-1">
                   {Array.isArray(topProducts) ? topProducts.reduce((acc: number, p: any) => acc + (p?.value || 0), 0) : 0}
                 </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Financieros e inmovilizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Valor de Inventario */}
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 shadow-lg shadow-indigo-500/20 text-white flex items-center justify-between">
           <div>
              <div className="flex items-center gap-2 mb-2 text-indigo-100">
                <Database className="w-5 h-5" />
                <h3 className="font-semibold text-sm uppercase tracking-wider">Capital Inmovilizado / Stock</h3>
              </div>
              <p className="text-4xl font-extrabold mb-1">
                {loadingValuation ? '...' : currencyFormatter(valuation?.valuation || 0)}
              </p>
              <p className="text-sm text-indigo-200">
                {loadingValuation ? 'Calculando...' : `Repartido en ${valuation?.total_items || 0} artículos físicos`}
              </p>
           </div>
           <div className="hidden sm:flex w-16 h-16 bg-white/10 rounded-full items-center justify-center shrink-0">
             <Package className="w-8 h-8" />
           </div>
        </div>

        <a
          href="/pos"
          className="bg-card border border-border hover:border-primary/50 group hover:shadow-md rounded-2xl p-6 transition-all flex items-center justify-between cursor-pointer"
        >
           <div>
              <div className="flex items-center gap-2 mb-2 text-muted-foreground group-hover:text-primary transition-colors">
                <ShoppingBag className="w-5 h-5" />
                <h3 className="font-semibold text-sm uppercase tracking-wider">Punto de Venta</h3>
              </div>
              <p className="text-2xl font-extrabold text-foreground">Abrir POS Terminal</p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">Registrar ventas, fiados, cobrar <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></p>
           </div>
           <div className="hidden sm:flex w-12 h-12 bg-primary/10 text-primary rounded-xl shrink-0 items-center justify-center">
             <ArrowUpRight className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
           </div>
        </a>
      </div>
    </div>
  );
}

function SaleReturnModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const createReturn = useCreateSaleReturn();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const submit = () => {
    const items = sale.items.filter((item) => Number(quantities[item.product_id] || 0) > 0).map((item) => ({ product_id: item.product_id, quantity: Number(quantities[item.product_id]) }));
    if (!items.length || !reason.trim()) return;
    createReturn.mutate({ id: sale.id, data: { items, reason: reason.trim() } }, { onSuccess: onClose });
  };
  return <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"><div className="bg-card rounded-2xl p-6 w-full max-w-lg space-y-4"><div className="flex justify-between items-center"><h2 className="text-xl font-bold">Devolver venta</h2><button onClick={onClose}><X className="w-5 h-5" /></button></div><div className="space-y-2 max-h-52 overflow-auto">{sale.items.map((item) => <label key={item.product_id} className="flex gap-3 items-center border-b border-border pb-2"><span className="flex-1 text-sm">{item.product?.name || item.product_id.slice(0, 8)}<small className="block text-muted-foreground">Vendidas: {item.quantity}</small></span><input type="number" min="0" max={Number(item.quantity)} step="0.01" value={quantities[item.product_id] || ''} onChange={(e) => setQuantities({ ...quantities, [item.product_id]: Number(e.target.value) })} className="w-24 p-2 bg-background border border-border rounded-lg" /></label>)}</div><textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo de la devolución" className="w-full p-3 bg-background border border-border rounded-xl" /><div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 border rounded-xl">Cancelar</button><button onClick={submit} disabled={createReturn.isPending} className="flex-1 py-2 bg-destructive text-white rounded-xl font-bold">Confirmar devolución</button></div></div></div>;
}
