import fs from "fs";
import path from "path";
import {
  Product,
  Category,
  Order,
  StoreSettings,
  InventoryMovement,
  Promotion,
  User,
  Review,
  Coupon,
  MarqueeItem,
  HomepageSection,
} from "../types";
import {
  initialProducts,
  initialCategories,
  initialOrders,
  initialStoreSettings,
  initialPromotions,
  initialUsers,
  initialReviews,
  initialCoupons,
  initialMarquees,
  initialHomepageSections,
} from "./initialData";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  orders: Order[];
  settings: StoreSettings;
  promotions: Promotion[];
  inventoryMovements: InventoryMovement[];
  users: User[];
  reviews: Review[];
  coupons: Coupon[];
  marquees: MarqueeItem[];
  homepageSections: HomepageSection[];
}

const dataDir = path.join(process.cwd(), "data");
const dbFilePath = path.join(dataDir, "database.json");

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
      users: initialUsers,
      reviews: initialReviews,
      coupons: initialCoupons,
      marquees: initialMarquees,
      homepageSections: initialHomepageSections,
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialDb, null, 2), "utf-8");
  }
}

export async function getDatabase(): Promise<DatabaseSchema> {
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
          users: initialUsers,
          reviews: initialReviews,
          coupons: initialCoupons,
          marquees: initialMarquees,
          homepageSections: initialHomepageSections,
        };
      }
    } catch {
      // Fallback to local server JSON storage
    }
  }

  ensureDbFile();
  try {
    const raw = fs.readFileSync(dbFilePath, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
    let modified = false;
    if (!parsed.users || !Array.isArray(parsed.users)) {
      parsed.users = initialUsers;
      modified = true;
    }
    if (!parsed.reviews || !Array.isArray(parsed.reviews)) {
      parsed.reviews = initialReviews;
      modified = true;
    }
    if (!parsed.coupons || !Array.isArray(parsed.coupons)) {
      parsed.coupons = initialCoupons;
      modified = true;
    }
    if (!parsed.marquees || !Array.isArray(parsed.marquees)) {
      parsed.marquees = initialMarquees;
      modified = true;
    }
    if (!parsed.homepageSections || !Array.isArray(parsed.homepageSections)) {
      parsed.homepageSections = initialHomepageSections;
      modified = true;
    }
    if (modified) {
      fs.writeFileSync(dbFilePath, JSON.stringify(parsed, null, 2), "utf-8");
    }
    return parsed;
  } catch {
    return {
      products: initialProducts,
      categories: initialCategories,
      orders: initialOrders,
      settings: initialStoreSettings,
      promotions: initialPromotions,
      inventoryMovements: [],
      users: initialUsers,
      reviews: initialReviews,
      coupons: initialCoupons,
      marquees: initialMarquees,
      homepageSections: initialHomepageSections,
    };
  }
}

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  ensureDbFile();
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), "utf-8");
}

