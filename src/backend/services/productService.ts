import { getDatabase, saveDatabase } from "../db/database";
import { Product } from "@/types";

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    const db = await getDatabase();
    return db.products;
  },

  async addProduct(
    productData: Omit<Product, "id">
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    const db = await getDatabase();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };

    db.products.unshift(newProduct);
    await saveDatabase(db);
    return { success: true, product: newProduct };
  },
};
