import { getDatabase, saveDatabase } from "../db/database";
import { Order } from "../types";

export const paymentService = {
  async submitPaymentProof(
    orderId: string,
    utr: string,
    evidenceUrl?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    if (typeof utr !== "string" || !/^[A-Za-z0-9-]{6,32}$/.test(utr.trim())) {
      return { success: false, error: "Valid 12-digit UTR reference is required" };
    }
    if (evidenceUrl !== undefined && (typeof evidenceUrl !== "string" || evidenceUrl.length > 2048 || !/^https:\/\//i.test(evidenceUrl))) {
      return { success: false, error: "Payment evidence must be a secure HTTPS URL." };
    }

    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);

    if (!order) {
      return { success: false, error: "Order not found" };
    }
    if (!["Awaiting Payment", "Rejected", "Payment Details Submitted", "Verification Pending"].includes(order.paymentStatus)) {
      return { success: false, error: "This order is not accepting payment details." };
    }

    order.paymentReference = utr.trim();
    if (evidenceUrl) order.paymentEvidenceUrl = evidenceUrl;
    order.paymentStatus = "Verification Pending";
    order.rejectionReason = undefined;
    order.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    return { success: true, order };
  },

  async verifyPayment(
    orderId: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Finalize physical stock deduction & clear reservation
    for (const item of order.itemsSnapshot) {
      const product = db.products.find((p) => p.id === item.productId);
      if (product) {
        const prevStock = product.stockQuantity;
        product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
        product.reservedQuantity = Math.max(0, product.reservedQuantity - item.quantity);

        if (!db.inventoryMovements) db.inventoryMovements = [];
        db.inventoryMovements.unshift({
          id: `mov-${Date.now()}-${product.id}`,
          productId: product.id,
          productName: product.productName,
          sku: product.sku,
          movementType: "SALE",
          quantity: item.quantity,
          previousQuantity: prevStock,
          newQuantity: product.stockQuantity,
          reason: `Payment verified by store owner for Order ${order.orderNumber}`,
          relatedOrderId: order.id,
          performedBy: "Store Owner",
          createdAt: new Date().toISOString(),
        });
      }
    }

    order.paymentStatus = "Verified";
    order.orderStatus = "Order Confirmed";
    order.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    return { success: true, order };
  },

  async rejectPayment(
    orderId: string,
    reason: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    if (!reason || !reason.trim()) {
      return { success: false, error: "Rejection reason is required" };
    }

    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Release stock reservation back to free inventory
    for (const item of order.itemsSnapshot) {
      const product = db.products.find((p) => p.id === item.productId);
      if (product) {
        const releaseQty = Math.min(product.reservedQuantity, item.quantity);
        product.reservedQuantity = Math.max(0, product.reservedQuantity - item.quantity);

        if (!db.inventoryMovements) db.inventoryMovements = [];
        db.inventoryMovements.unshift({
          id: `mov-${Date.now()}-${product.id}`,
          productId: product.id,
          productName: product.productName,
          sku: product.sku,
          movementType: "RELEASE",
          quantity: releaseQty,
          previousQuantity: product.stockQuantity,
          newQuantity: product.stockQuantity,
          reason: `Stock reservation released: Payment rejected for Order ${order.orderNumber} (${reason.trim()})`,
          relatedOrderId: order.id,
          performedBy: "Store Owner",
          createdAt: new Date().toISOString(),
        });
      }
    }

    order.paymentStatus = "Rejected";
    order.rejectionReason = reason.trim();
    order.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    return { success: true, order };
  },

  async getAllPayments(): Promise<any[]> {
    const db = await getDatabase();
    return db.orders
      .filter((o) => o.paymentReference || o.paymentStatus !== "Awaiting Payment" || o.razorpayPaymentId)
      .map((o) => ({
        id: `pay-${o.id}`,
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerMobile: o.customerMobile,
        amount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        paymentReference: o.paymentReference || o.razorpayPaymentId || "N/A",
        evidenceImageUrl: o.paymentEvidenceUrl,
        verificationStatus: o.paymentStatus,
        rejectionReason: o.rejectionReason,
        razorpayOrderId: o.razorpayOrderId,
        razorpayPaymentId: o.razorpayPaymentId,
        refundId: o.refundId,
        refundAmount: o.refundAmount,
        refundStatus: o.refundStatus,
        refundReason: o.refundReason,
        refundedAt: o.refundedAt,
        settlementId: o.settlementId,
        settlementStatus: o.settlementStatus,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      }));
  },
};
