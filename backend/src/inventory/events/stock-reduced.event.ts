/**
 * StockReducedEvent — Se emite cada vez que se descuenta stock de un producto.
 * El InventoryListener lo captura y verifica si hay que disparar una alerta.
 * Es asincrónico: la venta NO espera la verificación de stock.
 */
export class StockReducedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly productId: string,
    public readonly branchId: string,
    public readonly newQuantity: number,
    public readonly productName: string,
  ) {}
}
