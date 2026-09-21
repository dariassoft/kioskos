"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseReceivedEvent = void 0;
class PurchaseReceivedEvent {
    constructor(tenantId, purchaseOrderId, total, branchId, netAmount = total, vatAmount = 0) {
        this.tenantId = tenantId;
        this.purchaseOrderId = purchaseOrderId;
        this.total = total;
        this.branchId = branchId;
        this.netAmount = netAmount;
        this.vatAmount = vatAmount;
    }
}
exports.PurchaseReceivedEvent = PurchaseReceivedEvent;
//# sourceMappingURL=purchase-received.event.js.map