export type UserRole = "customer" | "owner";

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: UserRole;
  mobileVerified: boolean;
  emailVerified: boolean;
  accountStatus: "active" | "suspended";
  favorites?: string[];
  addresses?: Address[];
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  status: "active" | "inactive";
  expiryDate?: string;
}

export interface MarqueeItem {
  id: string;
  text: string;
  link?: string;
  position: "header" | "hero_top" | "footer";
  backgroundColor?: string;
  textColor?: string;
  status: "active" | "inactive";
}

export interface HomepageSection {
  id: string;
  type: "hero_banner" | "marquee" | "categories" | "featured_deals" | "best_sellers" | "trust_badges";
  title: string;
  enabled: boolean;
  order: number;
}

export interface Address {
  id: string;
  userId: string;
  recipientName: string;
  mobileNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface ProductVariant {
  sku: string;
  name: string;
  price: number;
  mrp: number;
  stockQuantity: number;
  attributes: Record<string, string>; // e.g. { "Storage": "256GB", "Color": "Titanium Gray" }
}

export interface Product {
  id: string;
  productName: string;
  slug: string;
  sku: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  description: string;
  images: string[];
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  specifications: Record<string, string>;
  warranty: string;
  variants: ProductVariant[];
  publicationStatus: "draft" | "active" | "archived";
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentCategoryId?: string | null;
  displayOrder: number;
  status: "active" | "inactive";
  itemCount?: number;
}

export interface CartItem {
  productId: string;
  variantSku?: string;
  quantity: number;
  unitPrice: number;
  product: Product;
}

export type PaymentStatus =
  | "Awaiting Payment"
  | "Payment Details Submitted"
  | "Verification Pending"
  | "Verified"
  | "Rejected"
  | "Refund Pending"
  | "Refunded";

export type OrderStatus =
  | "Order Created"
  | "Order Confirmed"
  | "Processing"
  | "Preparing for Dispatch"
  | "Dispatched"
  | "Delivered"
  | "Cancellation Requested"
  | "Cancelled";

export type DeliveryStatus =
  | "Not Arranged"
  | "Preparing for Dispatch"
  | "Ready for Dispatch"
  | "Dispatched"
  | "Delivered"
  | "Delivery Attempt Failed"
  | "Cancelled";

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  sku: string;
  variantSku?: string;
  variantDescription?: string;
  unitPrice: number;
  mrp: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  itemsSnapshot: OrderItemSnapshot[];
  shippingAddressSnapshot: Address;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  paymentMethod: "UPI" | "BANK_TRANSFER";
  paymentReference?: string; // UTR
  paymentEvidenceUrl?: string;
  rejectionReason?: string;
  manualDeliveryReference?: string; // e.g. "DTDC Consignment #7382910"
  deliveryNotes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  paymentMethod: "UPI" | "BANK_TRANSFER";
  paymentReference: string; // UTR / Reference
  transactionDate: string;
  amount: number;
  evidenceImageUrl?: string;
  verificationStatus: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  submittedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: "RESERVATION" | "SALE" | "MANUAL_ADJUSTMENT" | "RELEASE";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  relatedOrderId?: string;
  performedBy: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  badgeText: string;
  imageUrl: string;
  destinationUrl: string;
  bannerType: "hero" | "spotlight";
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
}

export interface StoreSettings {
  storeName: string;
  businessEntity: string;
  supportPhone: string;
  supportEmail: string;
  upiId: string;
  upiRecipientName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIFSC: string;
  bankName: string;
  bankBranch: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  reservationExpiryMinutes: number;
}

