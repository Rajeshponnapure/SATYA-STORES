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

    // 2. Atomic stock reservation & audit logging
    if (!db.inventoryMovements) db.inventoryMovements = [];
    const orderNumber = `SAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderId = `ord-${Date.now()}`;

    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (product) {
        product.reservedQuantity += item.quantity;
        db.inventoryMovements.unshift({
          id: `mov-${Date.now()}-${product.id}`,
          productId: product.id,
          productName: product.productName,
          sku: product.sku,
          movementType: "RESERVATION",
          quantity: item.quantity,
          previousQuantity: product.stockQuantity,
          newQuantity: product.stockQuantity,
          reason: `Stock reserved upon checkout for Order ${orderNumber}`,
          relatedOrderId: newOrderId,
          performedBy: "Customer Checkout",
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 3. Calculate order totals
    const subtotal = items.reduce(
      (sum: number, it: any) => sum + it.unitPrice * it.quantity,
      0
    );
    const shippingCharge =
      subtotal >= db.settings.freeShippingThreshold ? 0 : db.settings.standardShippingFee;
    const totalAmount = Math.max(0, subtotal - (payload as any).discount + shippingCharge);

    const newOrder: Order = {
      id: newOrderId,
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

  async getUserOrders(userId: string): Promise<Order[]> {
    const db = await getDatabase();
    return (db.orders || []).filter(
      (o) => o.userId === userId || o.customerEmail === userId
    );
  },

  async updateOrderStatus(
    orderId: string,
    orderStatus?: any,
    deliveryStatus?: any,
    deliveryNotes?: string,
    manualTrackingRef?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (deliveryStatus) order.deliveryStatus = deliveryStatus;
    if (deliveryNotes !== undefined) order.deliveryNotes = deliveryNotes;
    if (manualTrackingRef !== undefined) order.manualDeliveryReference = manualTrackingRef;
    order.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    return { success: true, order };
  },

  async modifyOrderItems(
    orderId: string,
    newItems: any[],
    discountAmount: number = 0
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const subtotal = newItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const shippingCharge =
      subtotal >= db.settings.freeShippingThreshold ? 0 : db.settings.standardShippingFee;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingCharge);

    order.itemsSnapshot = newItems;
    order.subtotal = subtotal;
    order.discount = discountAmount;
    order.shippingCharge = shippingCharge;
    order.totalAmount = totalAmount;
    order.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    return { success: true, order };
  },

  async cancelOrder(
    orderId: string,
    reason: string = "Cancelled by user"
  ): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Release reserved inventory
    if (!db.inventoryMovements) db.inventoryMovements = [];
    for (const item of order.itemsSnapshot) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (prod && prod.reservedQuantity > 0) {
        const releasedQty = Math.min(prod.reservedQuantity, item.quantity);
        prod.reservedQuantity -= releasedQty;

        db.inventoryMovements.unshift({
          id: `mov-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.productName,
          sku: prod.sku,
          movementType: "RELEASE",
          quantity: releasedQty,
          previousQuantity: prod.stockQuantity,
          newQuantity: prod.stockQuantity,
          reason: `Stock reservation released: Order ${order.orderNumber} cancelled (${reason})`,
          relatedOrderId: order.id,
          performedBy: "Store System",
          createdAt: new Date().toISOString(),
        });
      }
    }

    order.orderStatus = "Cancelled";
    order.paymentStatus = "Refund Pending";
    order.rejectionReason = reason;
    order.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    return { success: true };
  },
};

