import { NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/serverDb";

export async function PATCH(req: Request) {
  try {
    const { orderId, deliveryStatus, manualReference, notes } = await req.json();

    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (deliveryStatus) order.deliveryStatus = deliveryStatus;
    if (manualReference) order.manualDeliveryReference = manualReference;
    if (notes) order.deliveryNotes = notes;
    order.updatedAt = new Date().toISOString();

    await saveDatabase(db);

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update delivery status" },
      { status: 500 }
    );
  }
}
