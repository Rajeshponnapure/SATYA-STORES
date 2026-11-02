import { NextResponse } from "next/server";
import { orderService } from "@/backend/services/orderService";

export async function GET() {
  const orders = await orderService.getAllOrders();
  return NextResponse.json({ success: true, orders });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await orderService.createOrder(payload);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
