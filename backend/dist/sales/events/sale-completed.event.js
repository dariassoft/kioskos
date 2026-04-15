"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleCompletedEvent = void 0;
class SaleCompletedEvent {
    constructor(tenantId, saleId, total, paymentMethod, branchId, cashierId) {
        this.tenantId = tenantId;
        this.saleId = saleId;
        this.total = total;
        this.paymentMethod = paymentMethod;
        this.branchId = branchId;
        this.cashierId = cashierId;
    }
}
exports.SaleCompletedEvent = SaleCompletedEvent;
//# sourceMappingURL=sale-completed.event.js.map