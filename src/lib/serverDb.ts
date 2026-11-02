import fs from "fs";
import path from "path";
import { Product, Category, Order, StoreSettings, InventoryMovement, Promotion } from "@/types";
import {
  initialProducts,
  initialCategories,
  initialOrders,
  initialStoreSettings,
  initialPromotions,
} from "@/lib/initialData";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  orders: Order[];
  settings: StoreSettings;
  promotions: Promotion[];
  inventoryMovements: InventoryMovement[];
}

const dataDir = path.join(process.cwd(), "data");
const dbFilePath = path.join(dataDir, "database.json");

// Ensure data directory exists
function ensureDbFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbFilePath)) {
    const initialDb: DatabaseSchema = {
      products: initialProducts,
      categories: initialCategories,
      orders: initialOrders,
      settings: initialStoreSettings,
      promotions: initialPromotions,
      inventoryMovements: [],
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialDb, null, 2), "utf-8");
  }
}

// Read database
export async function getDatabase(): Promise<DatabaseSchema> {
  // If Supabase is connected, we can query Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const [
        { data: prodData },
        { data: catData },
        { data: ordData },
        { data: settingsData },
      ] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("orders").select("*"),
        supabase.from("store_settings").select("*").single(),
      ]);

      if (prodData && prodData.length > 0) {
        return {
          products: prodData as any,
          categories: (catData as any) || initialCategories,
          orders: (ordData as any) || initialOrders,
          settings: (settingsData as any) || initialStoreSettings,
          promotions: initialPromotions,
          inventoryMovements: [],
        };
      }
    } catch {
      // Fallback to local server JSON storage
    }
  }

  // Zero-cost Local Persistent Database
  ensureDbFile();
  try {
    const raw = fs.readFileSync(dbFilePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      products: initialProducts,
      categories: initialCategories,
      orders: initialOrders,
      settings: initialStoreSettings,
      promotions: initialPromotions,
      inventoryMovements: [],
    };
  }
}

// Save database
export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  ensureDbFile();
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), "utf-8");

  // If Supabase is connected, optionally mirror updates asynchronously
  if (isSupabaseConfigured && supabase) {
    try {
      // Optional async cloud sync without blocking
    } catch {
      // Ignore
    }
  }
}

