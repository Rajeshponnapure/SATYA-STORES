import { NextResponse } from "next/server";
import { inventoryService } from "@/backend/services/inventoryService";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await inventoryService.adjustStock(payload);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to adjust stock" },
      { status: 500 }
    );
  }
}
