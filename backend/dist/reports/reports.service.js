"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sale_entity_1 = require("../sales/entities/sale.entity");
const inventory_entity_1 = require("../inventory/entities/inventory.entity");
function calendarDateKey(value) {
    if (value instanceof Date) {
        return [
            value.getUTCFullYear(),
            String(value.getUTCMonth() + 1).padStart(2, '0'),
            String(value.getUTCDate()).padStart(2, '0'),
        ].join('-');
    }
    const text = String(value);
    const datePrefix = /^(\d{4}-\d{2}-\d{2})/.exec(text)?.[1];
    if (datePrefix)
        return datePrefix;
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime()))
        return text.slice(0, 10);
    return [
        parsed.getUTCFullYear(),
        String(parsed.getUTCMonth() + 1).padStart(2, '0'),
        String(parsed.getUTCDate()).padStart(2, '0'),
    ].join('-');
}
let ReportsService = class ReportsService {
    constructor(saleRepo, inventoryRepo) {
        this.saleRepo = saleRepo;
        this.inventoryRepo = inventoryRepo;
    }
    async getDashboardMetrics(tenantId, branchId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const todaySalesQuery = this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.tenant_id = :tenantId', { tenantId })
            .andWhere('sale.status = :status', { status: 'completed' })
            .andWhere('sale.created_at >= :today', { today });
        if (branchId)
            todaySalesQuery.andWhere('sale.branch_id = :branchId', { branchId });
        const todayResult = await todaySalesQuery
            .select('SUM(sale.total)', 'total')
            .addSelect('COUNT(sale.id)', 'count')
            .getRawOne();
        const monthSalesQuery = this.saleRepo
            .createQueryBuilder('sale')
            .where('sale.tenant_id = :tenantId', { tenantId })
            .andWhere('sale.status = :status', { status: 'completed' })
            .andWhere('sale.created_at >= :firstDay', { firstDay: firstDayOfMonth });
        if (branchId)
            monthSalesQuery.andWhere('sale.branch_id = :branchId', { branchId });
        const monthResult = await monthSalesQuery
            .select('SUM(sale.total)', 'total')
            .getRawOne();
        return {
            sales_today: Number(todayResult?.total || 0),
            tickets_today: Number(todayResult?.count || 0),
            sales_month: Number(monthResult?.total || 0),
            avg_ticket: Number(todayResult?.count) > 0 ? Number(todayResult.total) / Number(todayResult.count) : 0,
        };
    }
    async getWeeklySalesChart(tenantId, branchId) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const query = this.saleRepo
            .createQueryBuilder('sale')
            .select('DATE(sale.created_at) as date')
            .addSelect('SUM(sale.total) as total')
            .addSelect('COUNT(sale.id) as tickets')
            .where('sale.tenant_id = :tenantId', { tenantId })
            .andWhere('sale.status = :status', { status: 'completed' })
            .andWhere('sale.created_at >= :date', { date: sevenDaysAgo });
        if (branchId)
            query.andWhere('sale.branch_id = :branchId', { branchId });
        const results = await query
            .groupBy('DATE(sale.created_at)')
            .orderBy('date', 'ASC')
            .getRawMany();
        const resultsByDate = new Map(results.map((result) => [calendarDateKey(result.date), result]));
        const chartData = [];
        for (let i = 0; i <= 6; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const dateStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
            const found = resultsByDate.get(dateStr);
            chartData.push({
                date: dateStr,
                total: found ? Number(found.total) : 0,
                tickets: found ? Number(found.tickets) : 0,
            });
        }
        return chartData;
    }
    async getTopSellingProducts(tenantId, branchId, limit = 5) {
        const query = this.saleRepo.manager
            .createQueryBuilder()
            .select('product.name', 'name')
            .addSelect('SUM(item.quantity)', 'qty')
            .addSelect('SUM(item.subtotal)', 'revenue')
            .from('sale_items', 'item')
            .innerJoin('sales', 'sale', 'sale.id = item.sale_id')
            .innerJoin('products', 'product', 'product.id = item.product_id AND product.tenant_id = :tenantId')
            .where('sale.tenant_id = :tenantId', { tenantId })
            .andWhere('sale.status = :status', { status: 'completed' });
        if (branchId)
            query.andWhere('sale.branch_id = :branchId', { branchId });
        const results = await query
            .groupBy('item.product_id, product.name')
            .orderBy('qty', 'DESC')
            .limit(limit)
            .getRawMany();
        return results.map(r => ({
            name: r.name,
            value: Number(r.qty),
            revenue: Number(r.revenue),
        }));
    }
    async getInventoryValuation(tenantId, branchId) {
        const query = this.inventoryRepo
            .createQueryBuilder('inv')
            .innerJoin('products', 'prod', 'prod.id = inv.product_id AND prod.tenant_id = :tenantId')
            .innerJoin('product_prices', 'price', 'price.product_id = prod.id AND price.price_list_id IN (SELECT tenantList.id FROM price_lists tenantList WHERE tenantList.tenant_id = :tenantId)')
            .innerJoin('price_lists', 'list', 'list.id = price.price_list_id AND list.is_default = true AND list.tenant_id = :tenantId')
            .where('inv.tenant_id = :tenantId', { tenantId })
            .andWhere('inv.stock_quantity > 0');
        if (branchId)
            query.andWhere('inv.branch_id = :branchId', { branchId });
        const result = await query
            .select('SUM(inv.stock_quantity * price.price)', 'valuation')
            .addSelect('SUM(inv.stock_quantity)', 'total_items')
            .getRawOne();
        return {
            valuation: Number(result?.valuation || 0),
            total_items: Number(result?.total_items || 0),
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map