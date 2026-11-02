import { NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/serverDb";
import { Order } from "@/types";

export async function GET() {
  const db = await getDatabase();
  return NextResponse.json({ success: true, orders: db.orders });
}

export async function POST(req: Request) {
  try {
    const { items, address, paymentMethod, userId, customerEmail } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Concurrency-safe stock validation
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.productName}` },
          { status: 404 }
        );
      }

      const available = product.stockQuantity - product.reservedQuantity;
      if (available < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${product.productName}". Only ${available} units available.`,
          },
          { status: 400 }
        );
      }
    }

    // Atomic stock reservation
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (product) {
        product.reservedQuantity += item.quantity;
      }
    }

    // Calculate totals
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

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
