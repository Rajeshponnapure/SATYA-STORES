import { getDatabase, saveDatabase } from "../db/database";
import { Order } from "../types";
import crypto from "crypto";

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
    couponCode?: string;
  }): Promise<{ success: boolean; order?: Order; error?: string }> {
    const { items, address, paymentMethod, userId, customerEmail, couponCode } = payload;
    if (!Array.isArray(items) || items.length < 1 || items.length > 20 || !address || !userId ||
      !["RAZORPAY", "UPI", "BANK_TRANSFER"].includes(paymentMethod) ||
      typeof address.recipientName !== "string" || address.recipientName.trim().length < 2 || address.recipientName.length > 100 ||
      typeof address.mobileNumber !== "string" || address.mobileNumber.length < 7 || address.mobileNumber.length > 24 ||
      typeof address.addressLine1 !== "string" || address.addressLine1.trim().length < 3 || address.addressLine1.length > 200 ||
      typeof address.city !== "string" || address.city.trim().length < 2 || address.city.length > 100 ||
      typeof address.state !== "string" || address.state.trim().length < 2 || address.state.length > 100 ||
      typeof address.postalCode !== "string" || address.postalCode.length < 4 || address.postalCode.length > 12) {
      return { success: false, error: "Order details are invalid." };
    }
    const db = await getDatabase();
    const pricedItems: Order["itemsSnapshot"] = [];

    for (const item of items) {
      if (!item || typeof item.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        return { success: false, error: "Order item details are invalid." };
      }
      const product = db.products.find((p) => p.id === item.productId && p.publicationStatus === "active");
      if (!product) {
        return { success: false, error: "One or more products are unavailable." };
      }
      const variant = item.variantSku ? product.variants?.find((v) => v.sku === item.variantSku) : undefined;
      if (item.variantSku && !variant) return { success: false, error: "A selected product option is unavailable." };
      const alreadyAdded = pricedItems.find((entry) => entry.productId === product.id && entry.variantSku === variant?.sku);
      const available = (variant?.stockQuantity ?? product.stockQuantity) - product.reservedQuantity;
      if (available < item.quantity + (alreadyAdded?.quantity || 0)) {
        return { success: false, error: `Insufficient stock for "${product.productName}".` };
      }
      if (alreadyAdded) {
        alreadyAdded.quantity += item.quantity;
        continue;
      }
      pricedItems.push({
        productId: product.id,
        productName: product.productName,
        sku: variant?.sku || product.sku,
        variantSku: variant?.sku,
        variantDescription: variant?.name,
        unitPrice: variant?.price ?? product.sellingPrice,
        mrp: variant?.mrp ?? product.mrp,
        quantity: item.quantity,
        image: product.images?.[0] || "",
      });
    }

    // 2. Atomic stock reservation & audit logging
    if (!db.inventoryMovements) db.inventoryMovements = [];
    const orderNumber = `SAT-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`;
    const newOrderId = `ord-${crypto.randomUUID()}`;

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
    const subtotal = pricedItems.reduce(
      (sum, it) => sum + it.unitPrice * it.quantity,
      0
    );
    const shippingCharge =
      subtotal >= db.settings.freeShippingThreshold ? 0 : db.settings.standardShippingFee;
    let discount = 0;
    if (typeof couponCode === "string" && couponCode.trim()) {
      const coupon = (db.coupons || []).find((entry) =>
        entry.code.toUpperCase() === couponCode.trim().toUpperCase() && entry.status === "active" &&
        (!entry.expiryDate || new Date(entry.expiryDate).getTime() > Date.now())
      );
      if (!coupon || subtotal < coupon.minOrderValue) return { success: false, error: "Coupon is invalid or no longer eligible." };
      discount = coupon.discountType === "fixed"
        ? coupon.discountValue
        : Math.min(subtotal * coupon.discountValue / 100, coupon.maxDiscountAmount ?? subtotal);
      discount = Math.max(0, Math.min(subtotal, discount));
    }
    const totalAmount = Math.max(0, subtotal - discount + shippingCharge);

    const newOrder: Order = {
      id: newOrderId,
      orderNumber,
      userId: userId || "guest-user",
      customerName: address.recipientName.trim(),
      customerMobile: address.mobileNumber.trim(),
      customerEmail: customerEmail || "customer@example.com",
      itemsSnapshot: pricedItems,
      shippingAddressSnapshot: {
        id: `addr-${crypto.randomUUID()}`,
        userId,
        recipientName: address.recipientName.trim(),
        mobileNumber: address.mobileNumber.trim(),
        addressLine1: address.addressLine1.trim(),
        addressLine2: typeof address.addressLine2 === "string" ? address.addressLine2.trim().slice(0, 200) : "",
        city: address.city.trim(),
        state: address.state.trim(),
        postalCode: address.postalCode.trim(),
        isDefault: true,
      },
      subtotal,
      discount,
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
    if (order.paymentStatus === "Verified" || order.paymentStatus === "Partially Refunded" || order.paymentStatus === "Refunded" ||
      !["Order Created", "Cancellation Requested"].includes(order.orderStatus)) {
      return { success: false, error: "This order can no longer be cancelled online." };
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
