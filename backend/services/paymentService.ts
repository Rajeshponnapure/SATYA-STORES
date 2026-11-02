import { getDatabase, saveDatabase } from "../db/database";
import { Order } from "../types";

export const paymentService = {
  async submitPaymentProof(
    orderId: string,
    utr: string,
    evidenceUrl?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    if (!utr || utr.trim().length < 6) {
      return { success: false, error: "Valid 12-digit UTR reference is required" };
    }

    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);

    if (!order) {
      return { success: false, error: "Order not found" };
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
        product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
        product.reservedQuantity = Math.max(0, product.reservedQuantity - item.quantity);
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
        product.reservedQuantity = Math.max(0, product.reservedQuantity - item.quantity);
      }
    }

    order.paymentStatus = "Rejected";
    order.rejectionReason = reason.trim();
    order.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    return { success: true, order };
  },
};

