import { getDatabase, saveDatabase } from "../db/database";
import { Product, Category } from "../types";

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    const db = await getDatabase();
    return db.products;
  },

  async getProductById(id: string): Promise<Product | null> {
    const db = await getDatabase();
    return db.products.find((p) => p.id === id || p.slug === id) || null;
  },

  async addProduct(
    productData: Omit<Product, "id">
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    const db = await getDatabase();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      slug: productData.slug || productData.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    };

    db.products.unshift(newProduct);
    await saveDatabase(db);
    return { success: true, product: newProduct };
  },

  async updateProduct(
    id: string,
    updates: Partial<Product>
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    const db = await getDatabase();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return { success: false, error: "Product not found" };
    }

    db.products[idx] = { ...db.products[idx], ...updates };
    await saveDatabase(db);
    return { success: true, product: db.products[idx] };
  },

  async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();
    const initialLen = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    if (db.products.length === initialLen) {
      return { success: false, error: "Product not found" };
    }
    await saveDatabase(db);
    return { success: true };
  },

  // Categories
  async getAllCategories(): Promise<Category[]> {
    const db = await getDatabase();
    return db.categories;
  },

  async addCategory(
    categoryData: Omit<Category, "id">
  ): Promise<{ success: boolean; category?: Category; error?: string }> {
    const db = await getDatabase();
    const newCat: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      slug: categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      displayOrder: categoryData.displayOrder || db.categories.length + 1,
      status: categoryData.status || "active",
      itemCount: 0,
    };

    db.categories.push(newCat);
    await saveDatabase(db);
    return { success: true, category: newCat };
  },

  async updateCategory(
    id: string,
    updates: Partial<Category>
  ): Promise<{ success: boolean; category?: Category; error?: string }> {
    const db = await getDatabase();
    const idx = db.categories.findIndex((c) => c.id === id);
    if (idx === -1) {
      return { success: false, error: "Category not found" };
    }

    db.categories[idx] = { ...db.categories[idx], ...updates };
    await saveDatabase(db);
    return { success: true, category: db.categories[idx] };
  },

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();
    db.categories = db.categories.filter((c) => c.id !== id);
    await saveDatabase(db);
    return { success: true };
  },
};


