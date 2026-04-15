import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
export declare class ReportsService {
    private readonly saleRepo;
    private readonly inventoryRepo;
    constructor(saleRepo: Repository<Sale>, inventoryRepo: Repository<Inventory>);
    getDashboardMetrics(tenantId: string, branchId?: string): Promise<{
        sales_today: number;
        tickets_today: number;
        sales_month: number;
        avg_ticket: number;
    }>;
    getWeeklySalesChart(tenantId: string, branchId?: string): Promise<{
        date: string;
        total: number;
        tickets: number;
    }[]>;
    getTopSellingProducts(tenantId: string, branchId?: string, limit?: number): Promise<{
        name: any;
        value: number;
        revenue: number;
    }[]>;
    getInventoryValuation(tenantId: string, branchId?: string): Promise<{
        valuation: number;
        total_items: number;
    }>;
}
