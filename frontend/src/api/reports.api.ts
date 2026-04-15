import apiClient from './client';
import type { DashboardMetrics, ChartData, TopProduct, InventoryValuation } from './reports.types';

export const reportsApi = {
  getDashboardMetrics: (branchId?: string) => 
    apiClient.get<DashboardMetrics>('/reports/dashboard', { params: { branchId } }).then((res: any) => res.data),
  
  getWeeklyChart: (branchId?: string) => 
    apiClient.get<ChartData[]>('/reports/chart/weekly', { params: { branchId } }).then((res: any) => res.data),
  
  getTopProducts: (branchId?: string) => 
    apiClient.get<TopProduct[]>('/reports/chart/top-products', { params: { branchId } }).then((res: any) => res.data),
    
  getInventoryValuation: (branchId?: string) => 
    apiClient.get<InventoryValuation>('/reports/inventory-valuation', { params: { branchId } }).then((res: any) => res.data),
};
