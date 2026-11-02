import { getDatabase, saveDatabase } from "../db/database";
import { Order } from "../types";

export const orderService = {
  async getAllOrders(): Promise<Order[]> {
    const db = await getDatabase();
    return db.orders;
  },

  async getOrderById(id: string): Promise<Order | null> {
    const db = await getDatabase();
    return db.orders.find((o) => o.id === id) || null;
  },

  async createOrder(payload: {
    items: any[];
    address: any;
    paymentMethod: "UPI" | "BANK_TRANSFER";
    userId?: string;
    customerEmail?: string;
  }): Promise<{ success: boolean; order?: Order; error?: string }> {
    const { items, address, paymentMethod, userId, customerEmail } = payload;
    const db = await getDatabase();

    // 1. Atomic stock validation
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) {
        return { success: false, error: `Product not found: ${item.productName}` };
      }
      const available = product.stockQuantity - product.reservedQuantity;
      if (available < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${product.productName}". Only ${available} units available.`,
        };
      }
    }

    // 2. Atomic stock reservation
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (product) {
        product.reservedQuantity += item.quantity;
      }
    }

    // 3. Calculate order totals
    const subtotal = items.reduce(
      (sum: number, it: any) => sum + it.unitPrice * it.quantity,
      0
    );
    const shippingCharge =
      subtotal >= db.settings.freeShippingThreshold ? 0 : db.settings.standardShippingFee;
    const totalAmount = subtotal + shippingCharge;
    const orderNumber = `SAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: userId || "guest-user",
      customerName: address.recipientName,
      customerMobile: address.mobileNumber,
      customerEmail: customerEmail || "customer@example.com",
      itemsSnapshot: items,
      shippingAddressSnapshot: address,
      subtotal,
      discount: 0,
      shippingCharge,
      totalAmount,
      orderStatus: "Order Created",
      paymentStatus: "Awaiting Payment",
      deliveryStatus: "Not Arranged",
      paymentMethod: paymentMethod || "UPI",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);
    await saveDatabase(db);

    return { success: true, order: newOrder };
  },
};

