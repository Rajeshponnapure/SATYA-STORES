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
    if (!productData.images || !Array.isArray(productData.images) || productData.images.length < 2) {
      return {
        success: false,
        error: "Product image validation failed: Minimum 2 images are required.",
      };
    }

    if (productData.images.length > 10) {
      return {
        success: false,
        error: "Product image validation failed: Maximum 10 images are allowed.",
      };
    }

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
    if (updates.images !== undefined) {
      if (!Array.isArray(updates.images) || updates.images.length < 2) {
        return {
          success: false,
          error: "Product image validation failed: Minimum 2 images are required.",
        };
      }
      if (updates.images.length > 10) {
        return {
          success: false,
          error: "Product image validation failed: Maximum 10 images are allowed.",
        };
      }
    }

    const db = await getDatabase();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return { success: false, error: "Product not found" };
    }

    db.products[idx] = { ...db.products[idx], ...updates };
    await saveDatabase(db);
    return { success: true, product: db.products[idx] };
  },

  // In-memory cache for recent deletions (allows instant undo within 1-2 minutes)
  recentlyDeleted: new Map<string, { product: Product; deletedAt: number }>(),

  async deleteProduct(id: string): Promise<{ success: boolean; deletedProduct?: Product; error?: string }> {
    const db = await getDatabase();
    const productToDelete = db.products.find((p) => p.id === id);
    if (!productToDelete) {
      return { success: false, error: "Product not found" };
    }

    // Cache product for undo recovery
    this.recentlyDeleted.set(id, { product: productToDelete, deletedAt: Date.now() });

    // Store in database.json deletedProducts archive for persistence
    if (!(db as any).deletedProducts) {
      (db as any).deletedProducts = [];
    }
    (db as any).deletedProducts = (db as any).deletedProducts.filter((p: Product) => p.id !== id);
    (db as any).deletedProducts.push(productToDelete);

    db.products = db.products.filter((p) => p.id !== id);
    await saveDatabase(db);
    return { success: true, deletedProduct: productToDelete };
  },

  async restoreProduct(id: string): Promise<{ success: boolean; product?: Product; error?: string }> {
    const db = await getDatabase();

    // Check in-memory cache first
    let cached = this.recentlyDeleted.get(id);
    let productToRestore: Product | undefined = cached?.product;

    // Fallback to persisted deletedProducts archive
    if (!productToRestore && (db as any).deletedProducts) {
      productToRestore = (db as any).deletedProducts.find((p: Product) => p.id === id);
    }

    if (!productToRestore) {
      return { success: false, error: "Product cannot be restored: not found in recent deletions or undo window expired." };
    }

    // Re-insert product into active list if not already present
    const alreadyExists = db.products.some((p) => p.id === id);
    if (!alreadyExists) {
      db.products.unshift(productToRestore);
    }

    // Remove from archive & memory cache
    this.recentlyDeleted.delete(id);
    if ((db as any).deletedProducts) {
      (db as any).deletedProducts = (db as any).deletedProducts.filter((p: Product) => p.id !== id);
    }

    await saveDatabase(db);
    return { success: true, product: productToRestore };
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

