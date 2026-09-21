import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';

export const useDashboardMetrics = (branchId?: string) => {
  return useQuery({
    queryKey: ['reports', 'dashboard', branchId],
    queryFn: () => reportsApi.getDashboardMetrics(branchId),
  });
};

export const useWeeklyChart = (branchId?: string) => {
  return useQuery({
    queryKey: ['reports', 'weekly-chart', branchId],
    queryFn: () => reportsApi.getWeeklyChart(branchId),
  });
};

export const useTopProducts = (branchId?: string) => {
  return useQuery({
    queryKey: ['reports', 'top-products', branchId],
    queryFn: () => reportsApi.getTopProducts(branchId),
  });
};

export const useInventoryValuation = (branchId?: string) => {
  return useQuery({
    queryKey: ['reports', 'inventory-valuation', branchId],
    queryFn: () => reportsApi.getInventoryValuation(branchId),
  });
};

export const useSalesByDate = (date: string | null, branchId?: string) => useQuery({
  queryKey: ['reports', 'sales-by-date', date, branchId],
  queryFn: () => reportsApi.getSalesByDate({ start_date: date || undefined, end_date: date || undefined, branch_id: branchId }),
  enabled: Boolean(date),
});
