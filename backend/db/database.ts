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
import { hashPassword } from "../utils/auth";

export const initialStoreSettings: StoreSettings = {
  storeName: "Satya Stores",
  businessEntity: "Vasavi Enterprises",
  supportPhone: "+91 98490 12345",
  supportEmail: "support@satyastores.in",
  upiId: "vasavienterprises@okaxis",
  upiRecipientName: "Satya Stores (Vasavi Enterprises)",
  bankAccountName: "Vasavi Enterprises",
  bankAccountNumber: "923020048192837",
  bankIFSC: "UTIB0001234",
  bankName: "Axis Bank Ltd",
  bankBranch: "Main Branch, MG Road",
  freeShippingThreshold: 999,
  standardShippingFee: 49,
  reservationExpiryMinutes: 30,
};

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
    twoFactorPin: a.two_factor_pin || a.twoFactorPin || "739201",
    updatedAt: a.updated_at || a.updatedAt || new Date().toISOString(),
  };
}

function ensureDbFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbFilePath)) {
    const emptyDb: DatabaseSchema = {
      products: [],
      categories: [],
      orders: [],
      settings: initialStoreSettings,
      promotions: [],
      inventoryMovements: [],
      users: [],
      adminProfile: initialAdminProfile,
      reviews: [],
      coupons: [],
      marquees: [],
      homepageSections: [],
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(emptyDb, null, 2), "utf-8");
  }
}

export async function getDatabase(): Promise<DatabaseSchema> {
  // 1. Prioritize Live Supabase Cloud Database Query
  if (isSupabaseConfigured && supabase) {
    try {
      const [
        { data: prodData, error: prodErr },
        { data: catData, error: catErr },
        { data: ordData },
        { data: settingsData },
        { data: usersData, error: userErr },
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

      if (!prodErr && prodData) {
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
          promotions: [],
          inventoryMovements: [],
          users: liveUsers,
          adminProfile: mapSupabaseAdmin(adminData),
          reviews: (revData as any) || [],
          coupons: [],
          marquees: (marqData as any) || [],
          homepageSections: [],
        };

        // Cache live Supabase snapshot to local JSON
        ensureDbFile();
        fs.writeFileSync(dbFilePath, JSON.stringify(liveSchema, null, 2), "utf-8");
        return liveSchema;
      }
    } catch (e) {
      console.warn("[Database] Live Supabase query error, using local database cache:", e);
    }
  }

  // 2. Synchronized Local JSON Database
  ensureDbFile();
  try {
    const raw = fs.readFileSync(dbFilePath, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
    return parsed;
  } catch {
    return {
      products: [],
      categories: [],
      orders: [],
      settings: initialStoreSettings,
      promotions: [],
      inventoryMovements: [],
      users: [],
      adminProfile: initialAdminProfile,
      reviews: [],
      coupons: [],
      marquees: [],
      homepageSections: [],
    };
  }
}

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  ensureDbFile();
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), "utf-8");

  // Sync mutations to live Supabase Cloud Database
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
        });
      }
    } catch (e) {
      console.warn("[Database] Async sync to Supabase failed:", e);
    }
  }
}
