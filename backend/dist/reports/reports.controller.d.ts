import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getDashboardMetrics(tenantId: string, branchId?: string): Promise<{
        sales_today: number;
        tickets_today: number;
        sales_month: number;
        avg_ticket: number;
    }>;
    getWeeklyChart(tenantId: string, branchId?: string): Promise<{
        date: string;
        total: number;
        tickets: number;
    }[]>;
    getTopProducts(tenantId: string, branchId?: string): Promise<{
        name: any;
        value: number;
        revenue: number;
    }[]>;
    getInventoryValuation(tenantId: string, branchId?: string): Promise<{
        valuation: number;
        total_items: number;
    }>;
}
