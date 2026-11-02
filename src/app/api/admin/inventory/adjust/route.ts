import { NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/serverDb";
import { InventoryMovement } from "@/types";

export async function POST(req: Request) {
  try {
    const { productId, newQuantity, reason, performedBy } = await req.json();

    const db = await getDatabase();
    const product = db.products.find((p) => p.id === productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const prevQty = product.stockQuantity;
    const diff = Number(newQuantity) - prevQty;
    product.stockQuantity = Math.max(0, Number(newQuantity));

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      productName: product.productName,
      sku: product.sku,
      movementType: "MANUAL_ADJUSTMENT",
      quantity: Math.abs(diff),
      previousQuantity: prevQty,
      newQuantity: Number(newQuantity),
      reason: reason || "Manual stock inventory adjustment",
      performedBy: performedBy || "Store Owner",
      createdAt: new Date().toISOString(),
    };

    db.inventoryMovements.unshift(movement);
    await saveDatabase(db);

    return NextResponse.json({ success: true, product, movement });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to adjust stock" },
      { status: 500 }
    );
  }
}
