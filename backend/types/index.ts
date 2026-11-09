export type UserRole = "customer" | "owner" | "admin";

export interface AdminProfile {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  businessEntity: string;
  role: "owner";
  twoFactorEnabled: boolean;
  twoFactorMethod: "OTP_SMS_EMAIL" | "SECURITY_PIN" | "EXTERNAL_AUTHENTICATOR";
  twoFactorSecret?: string;
  twoFactorPin?: string;
  profileImage?: string;
  updatedAt: string;
}

export interface AdminPasskey {
  /** Base64URL WebAuthn credential ID. */
  id: string;
  /** Base64URL COSE public key; never sent to the browser. */
  publicKey: string;
  counter: number;
  transports?: string[];
  /** Only device-bound credentials are accepted for the admin account. */
  deviceType: "singleDevice";
  backedUp: false;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  password?: string; // Hashed or stored credential
  role: UserRole;
  mobileVerified: boolean;
  emailVerified: boolean;
  accountStatus: "active" | "suspended";
  favorites?: string[]; // Product IDs
  addresses?: Address[];
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
  twoFactorPendingSecret?: string;
  twoFactorPendingExpiresAt?: string;
  adminPasskeys?: AdminPasskey[];
  adminDeviceEnrollmentHash?: string;
  adminDeviceEnrollmentExpiresAt?: string;
  profileImage?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
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
  | "Refunded"
  | "Partially Refunded";

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
  paymentMethod: "RAZORPAY" | "UPI" | "BANK_TRANSFER";
  paymentReference?: string; // UTR or Razorpay Payment ID
  paymentEvidenceUrl?: string;
  rejectionReason?: string;
  manualDeliveryReference?: string; // e.g. "DTDC Consignment #7382910"
  deliveryNotes?: string;
  notes?: string;

  // Razorpay Gateway fields
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  // Refund tracking
  refundId?: string;
  refundAmount?: number;
  refundStatus?: "pending" | "processed" | "failed";
  refundReason?: string;
  refundedAt?: string;

  // Settlement tracking
  settlementId?: string;
  settlementStatus?: "pending" | "settled";
  settledAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface RazorpaySettlement {
  id: string;
  amount: number;
  fees: number;
  tax: number;
  netAmount: number;
  status: "settled" | "pending";
  utr?: string;
  bankAccount?: string;
  orderIds: string[];
  createdAt: string;
  settledAt?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  paymentMethod: "RAZORPAY" | "UPI" | "BANK_TRANSFER";
  paymentReference: string; // UTR / Razorpay Payment ID
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  transactionDate: string;
  amount: number;
  evidenceImageUrl?: string;
  verificationStatus: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  refundId?: string;
  refundAmount?: number;
  refundStatus?: string;
  refundReason?: string;
  settlementId?: string;
  settlementStatus?: string;
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
