import { NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/serverDb";

export async function POST(req: Request) {
  try {
    const { orderId, reason } = await req.json();

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Release stock reservation
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

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to reject payment" },
      { status: 500 }
    );
  }
}
