import {
  Category,
  Product,
  Order,
  StoreSettings,
  Promotion,
  MarqueeItem,
  Coupon,
  HomepageSection,
} from "@/types";

export const initialCategories: Category[] = [];
export const initialProducts: Product[] = [];
export const initialOrders: Order[] = [];
export const initialPromotions: Promotion[] = [];
export const initialCoupons: Coupon[] = [];
export const initialMarquees: MarqueeItem[] = [];
export const initialHomepageSections: HomepageSection[] = [
  { id: "sec-hero", type: "hero_banner", title: "Hero Carousel Banners", enabled: true, order: 1 },
  { id: "sec-categories", type: "categories", title: "Shop by Category Grid", enabled: true, order: 2 },
  { id: "sec-best-sellers", type: "best_sellers", title: "Best Selling Electronics", enabled: true, order: 3 },
  { id: "sec-featured", type: "featured_deals", title: "All Electronics Catalog & Grid", enabled: true, order: 4 },
  { id: "sec-trust", type: "trust_badges", title: "Direct UPI & Trust Banner", enabled: true, order: 5 },
];

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
