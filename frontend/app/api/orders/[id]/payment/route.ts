import { NextResponse } from "next/server";
import { paymentService } from "@/backend/services/paymentService";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { utr, evidenceUrl } = await req.json();

    const result = await paymentService.submitPaymentProof(id, utr, evidenceUrl);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit payment details" },
      { status: 500 }
    );
  }
}
