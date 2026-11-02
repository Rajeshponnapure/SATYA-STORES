import { getDatabase, saveDatabase } from "../db/database";
import { Order, DeliveryStatus } from "../types";

export const deliveryService = {
  async updateDelivery(payload: {
    orderId: string;
    deliveryStatus: DeliveryStatus;
    manualReference?: string;
    notes?: string;
  }): Promise<{ success: boolean; order?: Order; error?: string }> {
    const { orderId, deliveryStatus, manualReference, notes } = payload;
    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (deliveryStatus) order.deliveryStatus = deliveryStatus;
    if (manualReference) order.manualDeliveryReference = manualReference;
    if (notes) order.deliveryNotes = notes;
    order.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    return { success: true, order };
  },
};

