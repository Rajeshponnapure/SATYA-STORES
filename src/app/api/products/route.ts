import { NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/serverDb";
import { Product } from "@/types";

export async function GET() {
  const db = await getDatabase();
  return NextResponse.json({ success: true, products: db.products });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await getDatabase();

    const newProduct: Product = {
      ...body,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    db.products.unshift(newProduct);
    await saveDatabase(db);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
