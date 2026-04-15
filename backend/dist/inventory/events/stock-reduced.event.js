"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockReducedEvent = void 0;
class StockReducedEvent {
    constructor(tenantId, productId, branchId, newQuantity, productName) {
        this.tenantId = tenantId;
        this.productId = productId;
        this.branchId = branchId;
        this.newQuantity = newQuantity;
        this.productName = productName;
    }
}
exports.StockReducedEvent = StockReducedEvent;
//# sourceMappingURL=stock-reduced.event.js.map