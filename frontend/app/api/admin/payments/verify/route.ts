import { NextResponse } from "next/server";
import { paymentService } from "@/backend/services/paymentService";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    const result = await paymentService.verifyPayment(orderId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
