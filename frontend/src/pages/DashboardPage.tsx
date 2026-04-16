import { useAuthStore } from '@store/auth.store';
import { useBranchStore } from '@store/branch.store';
import { 
  TrendingUp, ShoppingBag, Package, Users, ArrowUpRight, BarChart3, Database 
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
} from '@hooks/useReports';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { activeBranch } = useBranchStore();

  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics(activeBranch?.id);
  const { data: weeklyData = [], isLoading: loadingWeekly } = useWeeklyChart(activeBranch?.id);
  const { data: topProducts = [], isLoading: loadingTop } = useTopProducts(activeBranch?.id);
  const { data: valuation, isLoading: loadingValuation } = useInventoryValuation(activeBranch?.id);

  // Formateadores
  const currencyFormatter = (value: number) => `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  const dateFormatter = (dateStr: string) => {
    const d = new Date(dateStr);
    // Ajustar zona horaria local o simple slice
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
        <div className="stat-card">
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
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold">Ventas de los últimos 7 días</h2>
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
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
