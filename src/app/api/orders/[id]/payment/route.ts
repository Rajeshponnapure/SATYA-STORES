import { NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/serverDb";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { utr, evidenceUrl } = await req.json();

    if (!utr || utr.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "Valid 12-digit UTR reference is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const order = db.orders.find((o) => o.id === id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    order.paymentReference = utr.trim();
    if (evidenceUrl) order.paymentEvidenceUrl = evidenceUrl;
    order.paymentStatus = "Verification Pending";
    order.rejectionReason = undefined;
    order.updatedAt = new Date().toISOString();

    await saveDatabase(db);

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit payment details" },
      { status: 500 }
    );
  }
}
