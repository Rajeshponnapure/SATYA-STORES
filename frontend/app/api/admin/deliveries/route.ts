import { NextResponse } from "next/server";
import { deliveryService } from "@/backend/services/deliveryService";

export async function PATCH(req: Request) {
  try {
    const payload = await req.json();
    const result = await deliveryService.updateDelivery(payload);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update delivery" },
      { status: 500 }
    );
  }
}
