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
import { supabase, isSupabaseConfigured } from "./supabase";
import {
  initialCategories,
  initialProducts,
  initialStoreSettings,
  initialPromotions,
  initialOrders,
  initialUsers,
  initialReviews,
  initialCoupons,
  initialMarquees,
  initialHomepageSections,
} from "./initialData";

export { initialStoreSettings };

export const initialAdminProfile: AdminProfile = {
  id: "admin-master",
  fullName: "Satya Narayana",
  email: "admin@sathyastores.com",
  mobileNumber: "+91 98480 22338",
  businessEntity: "Vasavi Enterprises",
  role: "owner",
  twoFactorEnabled: true,
  twoFactorMethod: "OTP_SMS_EMAIL",
  twoFactorPin: "",
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
  deletedProducts?: Product[];
}

const dataDir = path.resolve(__dirname, "..", "data");
const dbFilePath = path.join(dataDir, "database.json");

// In-memory schema state to guarantee persistent reads across requests
let memoryDb: DatabaseSchema | null = null;

// ==========================================
// SUPABASE SNAKE_CASE <-> CAMELCASE MAPPERS
// ==========================================
function mapSupabaseProduct(p: any): Product {
  return {
    id: p.id,
    productName: p.product_name || p.productName || "",
    slug: p.slug || "",
    sku: p.sku || "",
    brand: p.brand || "",
    categoryId: p.category_id || p.categoryId || "",
    categoryName: p.category_name || p.categoryName || "",
    description: p.description || "",
    images: Array.isArray(p.images) ? p.images : [],
    mrp: Number(p.mrp || 0),
    sellingPrice: Number(p.selling_price ?? p.sellingPrice ?? 0),
    stockQuantity: Number(p.stock_quantity ?? p.stockQuantity ?? 0),
    reservedQuantity: Number(p.reserved_quantity ?? p.reservedQuantity ?? 0),
    lowStockThreshold: Number(p.low_stock_threshold ?? p.lowStockThreshold ?? 3),
    specifications: p.specifications || {},
    warranty: p.warranty || "",
    variants: Array.isArray(p.variants) ? p.variants : [],
    publicationStatus: p.publication_status || p.publicationStatus || "active",
    rating: Number(p.rating || 5.0),
    reviewCount: Number(p.review_count ?? p.reviewCount ?? 0),
    isFeatured: Boolean(p.is_featured ?? p.isFeatured),
    isBestSeller: Boolean(p.is_best_seller ?? p.isBestSeller),
    isNewArrival: Boolean(p.is_new_arrival ?? p.isNewArrival),
  };
}

function mapSupabaseCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name || "",
    slug: c.slug || "",
    description: c.description || "",
    image: c.image || "",
    displayOrder: Number(c.display_order ?? c.displayOrder ?? 0),
    status: c.status || "active",
    itemCount: c.item_count,
  };
}

function mapSupabaseUser(u: any): User {
  return {
    id: u.id,
    fullName: u.full_name || u.fullName || "",
    email: u.email || "",
    mobileNumber: u.mobile_number || u.mobileNumber || "",
    password: u.password || "",
    role: u.role || "customer",
    mobileVerified: Boolean(u.mobile_verified ?? u.mobileVerified),
    emailVerified: Boolean(u.email_verified ?? u.emailVerified),
    accountStatus: u.account_status || u.accountStatus || "active",
    favorites: Array.isArray(u.favorites) ? u.favorites : [],
    addresses: Array.isArray(u.addresses) ? u.addresses : [],
    profileImage: u.profile_image || u.profileImage || undefined,
    twoFactorSecret: u.two_factor_secret || u.twoFactorSecret || undefined,
    twoFactorEnabled: Boolean(u.two_factor_enabled ?? u.twoFactorEnabled ?? false),
    createdAt: u.created_at || u.createdAt || new Date().toISOString(),
  };
}

function mapSupabaseSettings(s: any): StoreSettings {
  if (!s) return initialStoreSettings;
  return {
    storeName: s.store_name || s.storeName || "Satya Stores",
    businessEntity: s.business_entity || s.businessEntity || "Vasavi Enterprises",
    supportPhone: s.support_phone || s.supportPhone || "+91 98490 12345",
    supportEmail: s.support_email || s.supportEmail || "support@satyastores.in",
    upiId: s.upi_id || s.upiId || "vasavienterprises@okaxis",
    upiRecipientName: s.upi_recipient_name || s.upiRecipientName || "Satya Stores (Vasavi Enterprises)",
    bankAccountName: s.bank_account_name || s.bankAccountName || "Vasavi Enterprises",
    bankAccountNumber: s.bank_account_number || s.bankAccountNumber || "923020048192837",
    bankIFSC: s.bank_ifsc || s.bankIFSC || "UTIB0001234",
    bankName: s.bank_name || s.bankName || "Axis Bank Ltd",
    bankBranch: s.bank_branch || s.bankBranch || "Main Branch, MG Road",
    freeShippingThreshold: Number(s.free_shipping_threshold ?? s.freeShippingThreshold ?? 999),
    standardShippingFee: Number(s.standard_shipping_fee ?? s.standardShippingFee ?? 49),
    reservationExpiryMinutes: Number(s.reservation_expiry_minutes ?? s.reservationExpiryMinutes ?? 30),
  };
}

function mapSupabaseAdmin(a: any): AdminProfile {
  if (!a) return initialAdminProfile;
  return {
    id: a.id || "admin-master",
    fullName: a.full_name || a.fullName || "Satya Narayana",
    email: a.email || "admin@sathyastores.com",
    mobileNumber: a.mobile_number || a.mobileNumber || "+91 98480 22338",
    businessEntity: a.business_entity || a.businessEntity || "Vasavi Enterprises",
    role: a.role || "owner",
    twoFactorEnabled: Boolean(a.two_factor_enabled ?? a.twoFactorEnabled ?? true),
    twoFactorMethod: a.two_factor_method || a.twoFactorMethod || "OTP_SMS_EMAIL",
    twoFactorSecret: a.two_factor_secret || a.twoFactorSecret || "JBSWY3DPEHPK3PXP",
    twoFactorPin: a.two_factor_pin || a.twoFactorPin || "",
    profileImage: a.profile_image || a.profileImage || undefined,
    updatedAt: a.updated_at || a.updatedAt || new Date().toISOString(),
  };
}

function resolveDatabaseFilePath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), "data", "database.json"),
    path.resolve(process.cwd(), "backend", "data", "database.json"),
    path.resolve(__dirname, "..", "data", "database.json"),
    path.resolve(__dirname, "data", "database.json"),
    path.resolve(__dirname, "..", "..", "backend", "data", "database.json"),
    path.resolve(__dirname, "..", "..", "data", "database.json"),
    "/tmp/database.json",
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {}
  }
  return null;
}

function loadInitialFallbackDatabase(): DatabaseSchema {
  const filePath = resolveDatabaseFilePath();
  if (filePath) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw) as DatabaseSchema;
      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        if (!parsed.homepageSections || parsed.homepageSections.length === 0) {
          parsed.homepageSections = initialHomepageSections || [];
        }
        return parsed;
      }
    } catch (e) {
      console.warn("[Database] Could not read JSON database file:", e);
    }
  }

  // Compile-time guaranteed seed data fallback
  return {
    products: initialProducts || [],
    categories: initialCategories || [],
    orders: initialOrders || [],
    settings: initialStoreSettings,
    promotions: initialPromotions || [],
    inventoryMovements: [],
    users: initialUsers || [],
    adminProfile: initialAdminProfile,
    reviews: initialReviews || [],
    coupons: initialCoupons || [],
    marquees: initialMarquees || [],
    homepageSections: initialHomepageSections || [],
    deletedProducts: [],
  };
}

export async function getDatabase(): Promise<DatabaseSchema> {
  // 1. Prioritize Live Supabase Cloud Database Query if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const [
        { data: prodData, error: prodErr },
        { data: catData },
        { data: ordData },
        { data: settingsData },
        { data: usersData },
        { data: adminData },
        { data: revData },
        { data: marqData },
      ] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("orders").select("*"),
        supabase.from("store_settings").select("*").maybeSingle(),
        supabase.from("users").select("*"),
        supabase.from("admin_profile").select("*").maybeSingle(),
        supabase.from("reviews").select("*"),
        supabase.from("marquees").select("*"),
      ]);

      if (!prodErr && prodData && prodData.length > 0) {
        const liveProducts = prodData.map(mapSupabaseProduct);
        const liveCategories = (catData || []).map(mapSupabaseCategory);
        const liveUsers = (usersData || []).map(mapSupabaseUser);
        const liveOrders = (ordData || []).map((o: any) => ({
          ...o,
          orderNumber: o.order_number || o.orderNumber,
          userId: o.user_id || o.userId,
          customerName: o.customer_name || o.customerName,
          customerMobile: o.customer_mobile || o.customerMobile,
          customerEmail: o.customer_email || o.customerEmail,
          itemsSnapshot: o.items_snapshot || o.itemsSnapshot || [],
          shippingAddressSnapshot: o.shipping_address_snapshot || o.shippingAddressSnapshot || {},
          orderStatus: o.order_status || o.orderStatus,
          paymentStatus: o.payment_status || o.paymentStatus,
          deliveryStatus: o.delivery_status || o.deliveryStatus,
          paymentMethod: o.payment_method || o.paymentMethod,
          paymentReference: o.payment_reference || o.paymentReference,
          paymentEvidenceUrl: o.payment_evidence_url || o.paymentEvidenceUrl,
          totalAmount: Number(o.total_amount ?? o.totalAmount ?? 0),
          subtotal: Number(o.subtotal ?? 0),
          discount: Number(o.discount ?? 0),
          shippingCharge: Number(o.shipping_charge ?? o.shippingCharge ?? 0),
        }));

        const liveSchema: DatabaseSchema = {
          products: liveProducts,
          categories: liveCategories,
          orders: liveOrders,
          settings: mapSupabaseSettings(settingsData),
          promotions: initialPromotions || [],
          inventoryMovements: [],
          users: liveUsers.length > 0 ? liveUsers : (initialUsers || []),
          adminProfile: mapSupabaseAdmin(adminData),
          reviews: (revData as any) || [],
          coupons: initialCoupons || [],
          marquees: (marqData && marqData.length > 0 ? (marqData as any) : initialMarquees) || [],
          homepageSections: initialHomepageSections || [],
          deletedProducts: [],
        };

        memoryDb = liveSchema;
        return liveSchema;
      }
    } catch (e: any) {
      console.warn("[Database] Live Supabase query notice, falling back to local store data:", e?.message || e);
    }
  }

  // 2. Return memory cache or initialize from local JSON database / seed
  if (!memoryDb) {
    memoryDb = loadInitialFallbackDatabase();
  }
  return memoryDb;
}

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  memoryDb = data;

  // Attempt local disk write when filesystem is available
  try {
    const targetFile = resolveDatabaseFilePath() || (process.env.VERCEL ? "/tmp/database.json" : dbFilePath);
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), "utf-8");
  } catch (err: any) {
    // In serverless readonly environments, fallback to /tmp
    try {
      fs.writeFileSync("/tmp/database.json", JSON.stringify(data, null, 2), "utf-8");
    } catch {}
  }

  // Sync mutations to live Supabase Cloud Database if configured
  if (isSupabaseConfigured && supabase) {
    try {
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
            variants: p.variants || [],
            publication_status: p.publicationStatus,
            rating: p.rating,
            review_count: p.reviewCount,
            is_featured: p.isFeatured,
            is_best_seller: p.isBestSeller,
            is_new_arrival: p.isNewArrival,
          }))
        );
      }

      if (data.users && data.users.length > 0) {
        await supabase.from("users").upsert(
          data.users.map((u) => ({
            id: u.id,
            full_name: u.fullName,
            email: u.email,
            mobile_number: u.mobileNumber,
            password: u.password,
            role: u.role,
            mobile_verified: u.mobileVerified,
            email_verified: u.emailVerified,
            account_status: u.accountStatus,
            favorites: u.favorites || [],
            addresses: u.addresses || [],
            profile_image: u.profileImage || null,
          }))
        );
      }

      if (data.categories && data.categories.length > 0) {
        await supabase.from("categories").upsert(
          data.categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            image: c.image,
            display_order: c.displayOrder,
            status: c.status,
          }))
        );
      }

      if (data.settings) {
        await supabase.from("store_settings").upsert({
          id: "primary_store_settings",
          store_name: data.settings.storeName,
          business_entity: data.settings.businessEntity,
          support_phone: data.settings.supportPhone,
          support_email: data.settings.supportEmail,
          upi_id: data.settings.upiId,
          upi_recipient_name: data.settings.upiRecipientName,
          bank_account_name: data.settings.bankAccountName,
          bank_account_number: data.settings.bankAccountNumber,
          bank_ifsc: data.settings.bankIFSC,
          bank_name: data.settings.bankName,
          bank_branch: data.settings.bankBranch,
          free_shipping_threshold: data.settings.freeShippingThreshold,
          standard_shipping_fee: data.settings.standardShippingFee,
          reservation_expiry_minutes: data.settings.reservationExpiryMinutes,
        });
      }

      if (data.adminProfile) {
        await supabase.from("admin_profile").upsert({
          id: "admin-master",
          full_name: data.adminProfile.fullName,
          email: data.adminProfile.email,
          mobile_number: data.adminProfile.mobileNumber,
          business_entity: data.adminProfile.businessEntity,
          role: data.adminProfile.role,
          two_factor_enabled: data.adminProfile.twoFactorEnabled,
          two_factor_method: data.adminProfile.twoFactorMethod,
          two_factor_pin: data.adminProfile.twoFactorPin,
          profile_image: data.adminProfile.profileImage || null,
        });
      }
    } catch (e: any) {
      console.warn("[Database] Async sync to Supabase warning:", e?.message || e);
    }
  }
}
