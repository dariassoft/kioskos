import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { StockReducedEvent } from './events/stock-reduced.event';
import { NotificationsGateway } from '../notifications/notifications.gateway';
export declare class InventoryListener {
    private readonly inventoryRepo;
    private readonly notificationsGateway;
    constructor(inventoryRepo: Repository<Inventory>, notificationsGateway: NotificationsGateway);
    handleStockReducedEvent(event: StockReducedEvent): Promise<void>;
}
