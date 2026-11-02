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
export const initialHomepageSections: HomepageSection[] = [];

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
