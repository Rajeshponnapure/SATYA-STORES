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

// Once the Supabase cloud state is loaded, memory stays authoritative for this process;
// wholesale re-reads would wipe any in-session mutation the cloud does not have yet.
let cloudLoaded = false;

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
    // Memory is authoritative after the first successful cloud load
    if (cloudLoaded && memoryDb) {
      return memoryDb;
    }
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

      const liveProducts = prodData && prodData.length > 0 ? prodData.map(mapSupabaseProduct) : (initialProducts || []);
      const liveCategories = catData && catData.length > 0 ? catData.map(mapSupabaseCategory) : (initialCategories || []);
      const liveUsers = usersData && usersData.length > 0 ? usersData.map(mapSupabaseUser) : (initialUsers || []);
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
        users: liveUsers,
        adminProfile: mapSupabaseAdmin(adminData),
        reviews: (revData as any) || [],
        coupons: initialCoupons || [],
        marquees: (marqData && marqData.length > 0 ? (marqData as any) : initialMarquees) || [],
        homepageSections: initialHomepageSections || [],
        deletedProducts: [],
      };

      // Seed initial data into Supabase if connecting to an empty database
      if (!usersData || usersData.length === 0 || !prodData || prodData.length === 0) {
        await saveDatabase(liveSchema).catch(() => undefined);
      }

      memoryDb = liveSchema;
      cloudLoaded = true;
      return liveSchema;
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

  // Sync all records directly to live Supabase Cloud Database if configured.
  // Every write is verified — Supabase failures used to disappear silently,
  // letting the app and the cloud database drift apart between requests.
  if (isSupabaseConfigured && supabase) {
    try {
      if (data.products && data.products.length > 0) {
        const { error: syncError } = await supabase.from("products").upsert(
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
        if (syncError) console.error("[Database] Supabase products sync failed:", syncError.message);
      }

      if (data.users && data.users.length > 0) {
        const { error: syncError } = await supabase.from("users").upsert(
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
            two_factor_secret: u.twoFactorSecret || null,
            two_factor_enabled: u.twoFactorEnabled || false,
          }))
        );
        if (syncError) console.error("[Database] Supabase users sync failed:", syncError.message);
      }

      if (data.categories && data.categories.length > 0) {
        const { error: syncError } = await supabase.from("categories").upsert(
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
        if (syncError) console.error("[Database] Supabase categories sync failed:", syncError.message);
      }

      if (data.orders && data.orders.length > 0) {
        const { error: syncError } = await supabase.from("orders").upsert(
          data.orders.map((o) => ({
            id: o.id,
            order_number: o.orderNumber,
            user_id: o.userId,
            customer_name: o.customerName,
            customer_mobile: o.customerMobile,
            customer_email: o.customerEmail,
            items_snapshot: o.itemsSnapshot,
            shipping_address_snapshot: o.shippingAddressSnapshot,
            order_status: o.orderStatus,
            payment_status: o.paymentStatus,
            delivery_status: o.deliveryStatus,
            payment_method: o.paymentMethod,
            payment_reference: o.paymentReference,
            payment_evidence_url: o.paymentEvidenceUrl,
            total_amount: o.totalAmount,
            subtotal: o.subtotal,
            discount: o.discount,
            shipping_charge: o.shippingCharge,
          }))
        );
        if (syncError) console.error("[Database] Supabase orders sync failed:", syncError.message);
      }

      if (data.settings) {
        const { error: syncError } = await supabase.from("store_settings").upsert({
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
        if (syncError) console.error("[Database] Supabase settings sync failed:", syncError.message);
      }

      if (data.adminProfile) {
        const { error: syncError } = await supabase.from("admin_profile").upsert({
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
        if (syncError) console.error("[Database] Supabase admin profile sync failed:", syncError.message);
      }

      if (data.reviews && data.reviews.length > 0) {
        const { error: syncError } = await supabase.from("reviews").upsert(
          data.reviews.map((r) => ({
            id: r.id,
            product_id: r.productId,
            user_id: r.userId,
            user_name: r.userName,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            created_at: r.createdAt,
          }))
        );
        if (syncError) console.error("[Database] Supabase reviews sync failed:", syncError.message);
      }

      if (data.marquees && data.marquees.length > 0) {
        const { error: syncError } = await supabase.from("marquees").upsert(
          data.marquees.map((m) => ({
            id: m.id,
            text: m.text,
            link: m.link || null,
            position: m.position,
            status: m.status,
            background_color: m.backgroundColor || null,
            text_color: m.textColor || null,
          }))
        );
        if (syncError) console.error("[Database] Supabase marquees sync failed:", syncError.message);
      }

      // Upserts cannot remove rows; propagate deletions by dropping cloud rows
      // that are no longer part of the in-memory database.
      const syncedCollections: Array<[string, any[]]> = [
        ["products", data.products],
        ["categories", data.categories],
        ["orders", data.orders],
        ["users", data.users],
        ["reviews", data.reviews],
        ["marquees", data.marquees],
      ];
      for (const [table, rows] of syncedCollections) {
        const currentIds = (rows || []).map((row) => row.id).filter(Boolean);
        const { data: remoteRows, error: readError } = await supabase.from(table).select("id");
        if (readError) {
          console.error(`[Database] Supabase ${table} id read failed:`, readError.message);
          continue;
        }
        const currentSet = new Set(currentIds);
        const staleIds = (remoteRows || []).map((row: any) => row.id).filter((id: string) => !currentSet.has(id));
        if (staleIds.length === 0) continue;
        const { error: deleteError } = await supabase.from(table).delete().in("id", staleIds);
        if (deleteError) {
          console.error(`[Database] Supabase ${table} delete of ${staleIds.length} row(s) failed:`, deleteError.message);
        }
      }
    } catch (e: any) {
      console.warn("[Database] Async sync to Supabase warning:", e?.message || e);
    }
  }
}
