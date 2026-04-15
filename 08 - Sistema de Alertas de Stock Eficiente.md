Para que el sistema de alertas sea eficiente sin afectar el rendimiento de las ventas, implementaremos un enfoque **basado en eventos**. Esto significa que el proceso de venta no se detiene a calcular alertas; simplemente emite una señal y otro servicio se encarga de verificar el stock en segundo plano.

Aquí tienes la implementación detallada para el **Inventory Service** y el sistema de **Alertas Automáticas**.

### ---

**1\. Definición del Evento de Stock**

Primero, instalamos el paquete de eventos de NestJS: npm install @nestjs/event-emitter.

TypeScript

// inventory/events/stock-reduced.event.ts  
export class StockReducedEvent {  
  constructor(  
    public readonly tenantId: string,  
    public readonly productId: string,  
    public readonly branchId: string,  
    public readonly newQuantity: number,  
  ) {}  
}

### ---

**2\. El Servicio de Inventario (inventory.service.ts)**

Este servicio se encarga de actualizar los números y disparar el evento.

TypeScript

@Injectable()  
export class InventoryService {  
  constructor(  
    private inventoryRepo: Repository\<Inventory\>,  
    private eventEmitter: EventEmitter2,  
  ) {}

  async updateStock(productId: string, branchId: string, quantity: number, tenantId: string) {  
    // 1\. Actualizar el stock en la DB  
    await this.inventoryRepo.decrement(  
      { product\_id: productId, branch\_id: branchId, tenant\_id: tenantId },  
      'stock\_quantity',  
      quantity  
    );

    // 2\. Obtener el nuevo estado para verificar umbrales  
    const updatedInventory \= await this.inventoryRepo.findOne({  
      where: { product\_id: productId, branch\_id: branchId, tenant\_id: tenantId },  
      relations: \['product'\]  
    });

    // 3\. Emitir evento para que el sistema de alertas lo procese  
    this.eventEmitter.emit(  
      'stock.reduced',  
      new StockReducedEvent(tenantId, productId, branchId, updatedInventory.stock\_quantity)  
    );

    return updatedInventory;  
  }  
}

### ---

**3\. El Escuchador de Alertas (inventory.listener.ts)**

Este componente "escucha" cada vez que el stock baja y decide si debe notificar al usuario.

TypeScript

@Injectable()  
export class InventoryListener {  
  constructor(  
    private inventoryRepo: Repository\<Inventory\>,  
    private notificationsGateway: NotificationsGateway, // Para WebSockets  
  ) {}

  @OnEvent('stock.reduced')  
  async handleStockReducedEvent(event: StockReducedEvent) {  
    const item \= await this.inventoryRepo.findOne({  
      where: { product\_id: event.productId, branch\_id: event.branchId, tenant\_id: event.tenantId },  
      relations: \['product'\]  
    });

    // Verificamos si el stock cayó por debajo del mínimo configurado  
    if (item.stock\_quantity \<= item.min\_stock\_alert) {  
      // Enviamos notificación en tiempo real vía WebSocket  
      this.notificationsGateway.sendLowStockAlert(event.tenantId, {  
        productName: item.product.name,  
        currentStock: item.stock\_quantity,  
        branchId: event.branchId  
      });  
        
      // Aquí también podrías disparar un correo electrónico si el plan es "Profesional"  
    }  
  }  
}

### ---

**4\. Notificaciones en Tiempo Real (WebSockets)**

Para que el cajero o el dueño vean la alerta en el Dashboard sin refrescar la página.

TypeScript

// notifications/notifications.gateway.ts  
@WebSocketGateway({ cors: true })  
export class NotificationsGateway {  
  @WebSocketServer()  
  server: Server;

  sendLowStockAlert(tenantId: string, data: any) {  
    // Emitimos solo al "cuarto" del tenant específico por seguridad  
    this.server.to(\`tenant\_${tenantId}\`).emit('low\_stock\_alert', data);  
  }  
}

### ---

**🚀 Beneficios de esta Implementación**

1. **Asincronismo:** La venta se completa instantáneamente. El chequeo de stock ocurre milisegundos después sin bloquear al cliente.  
2. **Escalabilidad:** Si en el futuro quieres añadir alertas por WhatsApp o Email, solo tienes que agregar otro @OnEvent('stock.reduced') sin tocar el código de ventas.  
3. **Seguridad Multi-tenant:** Usamos to('tenant\_id') en WebSockets para asegurar que las alertas de una tienda no lleguen a otra.

### ---

**💡 Próximo Paso Sugerido**

Para cerrar el ciclo comercial, ¿te gustaría que desarrollemos la lógica del **Módulo de Ventas (POS)**, incluyendo cómo manejar los diferentes **Métodos de Pago** (Efectivo vs. Fiado)?