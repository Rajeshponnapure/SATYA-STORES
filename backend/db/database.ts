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
  AdminProfile,
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
import { hashPassword } from "../utils/auth";

export const initialAdminProfile: AdminProfile = {
  id: "admin-master",
  fullName: "Satya Narayana",
  email: "admin@sathyastores.com",
  mobileNumber: "+91 98480 22338",
  businessEntity: "Vasavi Enterprises",
  role: "owner",
  twoFactorEnabled: true,
  twoFactorMethod: "OTP_SMS_EMAIL",
  twoFactorPin: "739201",
  updatedAt: new Date().toISOString(),
};

export interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  orders: Order[];
  settings: StoreSettings;
  promotions: Promotion[];
  inventoryMovements: InventoryMovement[];
  users: User[];
  adminProfile?: AdminProfile;
  reviews: Review[];
  coupons: Coupon[];
  marquees: MarqueeItem[];
  homepageSections: HomepageSection[];
}

const dataDir = path.resolve(__dirname, "..", "data");
const dbFilePath = path.join(dataDir, "database.json");

function ensureDbFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbFilePath)) {
    // Hash initial passwords for security
    const secureUsers = initialUsers.map((u) => ({
      ...u,
      password: hashPassword(u.password || "customer123"),
    }));

    const initialDb: DatabaseSchema = {
      products: initialProducts,
      categories: initialCategories,
      orders: initialOrders,
      settings: initialStoreSettings,
      promotions: initialPromotions,
      inventoryMovements: [],
      users: secureUsers,
      adminProfile: initialAdminProfile,
      reviews: initialReviews,
      coupons: initialCoupons,
      marquees: initialMarquees,
      homepageSections: initialHomepageSections,
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialDb, null, 2), "utf-8");
  }
}

export async function getDatabase(): Promise<DatabaseSchema> {
  // If Supabase is configured and reachable, attempt live Supabase query
  if (isSupabaseConfigured && supabase) {
    try {
      const [
        { data: prodData, error: prodErr },
        { data: catData },
        { data: ordData },
        { data: settingsData },
        { data: usersData },
      ] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("orders").select("*"),
        supabase.from("store_settings").select("*").maybeSingle(),
        supabase.from("users").select("*"),
      ]);

      // If Supabase tables exist and return rows
      if (!prodErr && prodData && prodData.length > 0) {
        return {
          products: prodData as any,
          categories: (catData as any) || initialCategories,
          orders: (ordData as any) || initialOrders,
          settings: (settingsData as any) || initialStoreSettings,
          promotions: initialPromotions,
          inventoryMovements: [],
          users: (usersData as any) || initialUsers,
          adminProfile: initialAdminProfile,
          reviews: initialReviews,
          coupons: initialCoupons,
          marquees: initialMarquees,
          homepageSections: initialHomepageSections,
        };
      }
    } catch {
      // Graceful fallback to local JSON database
    }
  }

  ensureDbFile();
  try {
    const raw = fs.readFileSync(dbFilePath, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
    let modified = false;

    // Migrate any plaintext passwords to hashed passwords automatically
    if (parsed.users && Array.isArray(parsed.users)) {
      for (const u of parsed.users) {
        if (u.password && (!u.password.includes(":") || u.password.length < 50)) {
          u.password = hashPassword(u.password);
          modified = true;
        }
      }
    } else {
      parsed.users = initialUsers.map((u) => ({
        ...u,
        password: hashPassword(u.password || "customer123"),
      }));
      modified = true;
    }

    if (!parsed.adminProfile) {
      parsed.adminProfile = initialAdminProfile;
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
      users: initialUsers.map((u) => ({
        ...u,
        password: hashPassword(u.password || "customer123"),
      })),
      adminProfile: initialAdminProfile,
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

  // Asynchronously attempt to sync to Supabase if configured and reachable
  if (isSupabaseConfigured && supabase) {
    try {
      // Upsert products to Supabase if table is present
      if (data.products && data.products.length > 0) {
        await supabase.from("products").upsert(
          data.products.map((p) => ({
            id: p.id,
            product_name: p.productName,
            slug: p.slug,
            sku: p.sku,
            brand: p.brand,
            category_id: p.categoryId,
            category_name: p.categoryName,
            description: p.description,
            images: p.images,
            mrp: p.mrp,
            selling_price: p.sellingPrice,
            stock_quantity: p.stockQuantity,
            reserved_quantity: p.reservedQuantity,
            low_stock_threshold: p.lowStockThreshold || 3,
            specifications: p.specifications || {},
            warranty: p.warranty,
            publication_status: p.publicationStatus,
            rating: p.rating,
            review_count: p.reviewCount,
            is_featured: p.isFeatured,
            is_best_seller: p.isBestSeller,
            is_new_arrival: p.isNewArrival,
          }))
        );
      }
    } catch {
      // Silently handle schema cache mismatch; local JSON is authoritative
    }
  }
}
