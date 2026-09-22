import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
// We just need raw SQL/TypeORM queries for aggregations, we do not need to inject large services.

interface WeeklySalesRow {
  date: string | Date;
  total: string | number;
  tickets: string | number;
}

function calendarDateKey(value: string | Date): string {
  if (value instanceof Date) {
    // MySQL puede devolver DATE(...) como Date en consultas raw. Usar UTC
    // conserva el día calendario producido por la base y evita perderlo por
    // una segunda conversión de zona horaria.
    return [
      value.getUTCFullYear(),
      String(value.getUTCMonth() + 1).padStart(2, '0'),
      String(value.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  const text = String(value);
  const datePrefix = /^(\d{4}-\d{2}-\d{2})/.exec(text)?.[1];
  if (datePrefix) return datePrefix;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text.slice(0, 10);
  return [
    parsed.getUTCFullYear(),
    String(parsed.getUTCMonth() + 1).padStart(2, '0'),
    String(parsed.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
  ) {}

  // ==========================================
  // DASHBOARD GENERAL (Cifras macro)
  // ==========================================
  async getDashboardMetrics(tenantId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Ventas de hoy
    const todaySalesQuery = this.saleRepo
      .createQueryBuilder('sale')
      .where('sale.tenant_id = :tenantId', { tenantId })
      .andWhere('sale.status = :status', { status: 'completed' })
      .andWhere('sale.created_at >= :today', { today });
    
    if (branchId) todaySalesQuery.andWhere('sale.branch_id = :branchId', { branchId });
    
    const todayResult = await todaySalesQuery
      .select('SUM(sale.total)', 'total')
      .addSelect('COUNT(sale.id)', 'count')
      .getRawOne();

    // Ventas del mes
    const monthSalesQuery = this.saleRepo
      .createQueryBuilder('sale')
      .where('sale.tenant_id = :tenantId', { tenantId })
      .andWhere('sale.status = :status', { status: 'completed' })
      .andWhere('sale.created_at >= :firstDay', { firstDay: firstDayOfMonth });
      
    if (branchId) monthSalesQuery.andWhere('sale.branch_id = :branchId', { branchId });

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

  // ==========================================
  // GRÁFICO RECHARTS: VENTAS DE LOS ÚLTIMOS 7 DÍAS
  // ==========================================
  async getWeeklySalesChart(tenantId: string, branchId?: string) {
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

    if (branchId) query.andWhere('sale.branch_id = :branchId', { branchId });

    const results = await query
      .groupBy('DATE(sale.created_at)')
      .orderBy('date', 'ASC')
      .getRawMany<WeeklySalesRow>();
    const resultsByDate = new Map(results.map((result) => [calendarDateKey(result.date), result]));

    // Fill missing days with 0
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

  // ==========================================
  // TOP PRODUCTOS VENDIDOS (Dona / Ranking)
  // ==========================================
  async getTopSellingProducts(tenantId: string, branchId?: string, limit = 5) {
    const query = this.saleRepo.manager
      .createQueryBuilder()
      .select('product.name', 'name')
      .addSelect('SUM(item.quantity)', 'qty')
      .addSelect('SUM(item.subtotal)', 'revenue')
      .from('sale_items', 'item')
      .innerJoin('sales', 'sale', 'sale.id = item.sale_id')
      .innerJoin('products', 'product', 'product.id = item.product_id')
      .where('sale.tenant_id = :tenantId', { tenantId })
      .andWhere('sale.status = :status', { status: 'completed' });

    if (branchId) query.andWhere('sale.branch_id = :branchId', { branchId });

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

  // ==========================================
  // ESTADO DEL INVENTARIO Y CAPITAL INMOVILIZADO
  // ==========================================
  async getInventoryValuation(tenantId: string, branchId?: string) {
    // Calculamos el valor del inventario valorizado por el precio default.
    // Esto es muy útil como KPI financiero.
    const query = this.inventoryRepo
      .createQueryBuilder('inv')
      .innerJoin('products', 'prod', 'prod.id = inv.product_id')
      .innerJoin('product_prices', 'price', 'price.product_id = prod.id')
      .innerJoin('price_lists', 'list', 'list.id = price.price_list_id AND list.is_default = true')
      .where('inv.tenant_id = :tenantId', { tenantId })
      .andWhere('inv.stock_quantity > 0');

    if (branchId) query.andWhere('inv.branch_id = :branchId', { branchId });

    const result = await query
      .select('SUM(inv.stock_quantity * price.price)', 'valuation')
      .addSelect('SUM(inv.stock_quantity)', 'total_items')
      .getRawOne();

    return {
      valuation: Number(result?.valuation || 0),
      total_items: Number(result?.total_items || 0),
    };
  }
}
