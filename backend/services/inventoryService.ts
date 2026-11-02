import { getDatabase, saveDatabase } from "../db/database";
import { InventoryMovement, Product } from "../types";

export const inventoryService = {
  async adjustStock(payload: {
    productId: string;
    newQuantity: number;
    reason: string;
    performedBy?: string;
  }): Promise<{ success: boolean; product?: Product; movement?: InventoryMovement; error?: string }> {
    const { productId, newQuantity, reason, performedBy } = payload;
    const db = await getDatabase();
    const product = db.products.find((p) => p.id === productId);

    if (!product) {
      return { success: false, error: "Product not found" };
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
      reason: reason || "Manual stock count adjustment",
      performedBy: performedBy || "Store Owner",
      createdAt: new Date().toISOString(),
    };

    db.inventoryMovements.unshift(movement);
    await saveDatabase(db);

    return { success: true, product, movement };
  },

  async getMovements(): Promise<InventoryMovement[]> {
    const db = await getDatabase();
    return db.inventoryMovements;
  },
};

