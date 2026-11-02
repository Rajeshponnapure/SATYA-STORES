import { NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/serverDb";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Finalize stock deduction: deduct physical stock & clear reserved quantity
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

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
