import { NextResponse } from "next/server";
import { productService } from "@/backend/services/productService";

export async function GET() {
  const products = await productService.getAllProducts();
  return NextResponse.json({ success: true, products });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await productService.addProduct(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
