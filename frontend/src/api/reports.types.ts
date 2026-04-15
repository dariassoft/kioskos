export interface DashboardMetrics {
  sales_today: number;
  tickets_today: number;
  sales_month: number;
  avg_ticket: number;
}

export interface ChartData {
  date: string;
  total: number;
  tickets: number;
}

export interface TopProduct {
  name: string;
  value: number;
  revenue: number;
}

export interface InventoryValuation {
  valuation: number;
  total_items: number;
}
