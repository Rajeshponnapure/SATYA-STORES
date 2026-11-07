"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  Product,
  Category,
  CartItem,
  Order,
  StoreSettings,
  User,
  Promotion,
  OrderStatus,
  DeliveryStatus,
  Coupon,
  MarqueeItem,
  Review,
  HomepageSection,
  AdminProfile,
  RazorpaySettlement,
} from "@/types";
import {
  initialProducts,
  initialCategories,
  initialStoreSettings,
  initialOrders,
  initialPromotions,
  initialCoupons,
  initialMarquees,
  initialHomepageSections,
} from "@/lib/initialData";
import { toast } from "sonner";

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: { description?: string };
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      on: (event: string, callback: (response: RazorpayFailureResponse) => void) => void;
      open: () => void;
    };
  }
}

interface StoreContextType {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  orders: Order[];
  promotions: Promotion[];
  settings: StoreSettings;
  currentUser: User | null;
  isAdminAuthenticated: boolean;
  favorites: string[];
  appliedCoupon: Coupon | null;
  discountAmount: number;
  marquees: MarqueeItem[];
  homepageSections: HomepageSection[];
  isLoadingBackend: boolean;

  // Cart Actions
  addToCart: (product: Product, variantSku?: string, quantity?: number) => void;
  removeFromCart: (productId: string, variantSku?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, variantSku?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Checkout & Coupon Actions
  applyCoupon: (code: string) => Promise<{ success: boolean; discount?: number; error?: string }>;
  removeCoupon: () => void;
  createOrder: (orderData: {
    recipientName: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    paymentMethod: "RAZORPAY" | "UPI" | "BANK_TRANSFER";
  }) => Promise<Order | null>;
  submitPaymentDetails: (orderId: string, utr: string, evidenceUrl?: string) => Promise<boolean>;
  initiateRazorpayPayment: (order: Order) => Promise<{ success: boolean; error?: string }>;
  processRefund: (orderId: string, amount?: number, reason?: string) => Promise<{ success: boolean; error?: string }>;
  fetchSettlements: () => Promise<RazorpaySettlement[]>;

  // Customer Auth & Profile
  loginCustomer: (emailOrPhone: string, passwordAttempt: string) => Promise<{ success: boolean; error?: string }>;
  signupCustomer: (fullName: string, email: string, mobileNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutCustomer: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  toggleFavorite: (productId: string) => Promise<void>;
  submitReview: (productId: string, rating: number, title: string, comment: string) => Promise<boolean>;
  fetchProductReviews: (productId: string) => Promise<Review[]>;
  requestPasswordReset: (emailOrPhone: string) => Promise<{ success: boolean; message?: string; simulatedOtp?: string; error?: string }>;
  resetPasswordWithOtp: (emailOrPhone: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Admin Auth & Management
  adminLogin: (password: string, usernameOrEmail?: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
  adminUsers: User[];
  fetchAdminUsers: (search?: string) => Promise<void>;
  adminCreateUser: (userData: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password?: string;
    role?: "customer" | "admin";
    accountStatus?: "active" | "suspended";
  }) => Promise<boolean>;
  adminUpdateUser: (
    id: string,
    updates: Partial<{
      fullName: string;
      email: string;
      mobileNumber: string;
      role: "customer" | "admin";
      accountStatus: "active" | "suspended";
    }>
  ) => Promise<boolean>;
  adminDeleteUser: (id: string) => Promise<boolean>;
  adminUpdateUserPassword: (userId: string, newPass: string) => Promise<boolean>;
  adminProfile: AdminProfile | null;
  fetchAdminProfile: () => Promise<AdminProfile | null>;
  updateAdminProfile: (updates: Partial<AdminProfile>) => Promise<boolean>;
  fetchAdmin2faSetup: () => Promise<{ success: boolean; secret: string; otpauthUri: string; provider: string } | null>;
  verifyAdmin2faCode: (code: string) => Promise<{ success: boolean; valid: boolean; method?: string; error?: string }>;
  generateAdmin2fa: () => Promise<{ success: boolean; otp?: string; message?: string }>;
  adminChangePasswordWith2FA: (currentPassword: string, newPassword: string, twoFactorCode: string) => Promise<{ success: boolean; error?: string }>;
  uploadImage: (fileName: string, fileData: string) => Promise<{ success: boolean; url?: string; error?: string }>;

  // Admin Catalog & Operations
  addProduct: (product: Omit<Product, "id">) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  restoreProduct: (id: string) => Promise<boolean>;
  addCategory: (category: Omit<Category, "id">) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  verifyPayment: (orderId: string) => Promise<boolean>;
  rejectPayment: (orderId: string, reason: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status?: OrderStatus, deliveryStatus?: DeliveryStatus, manualRef?: string, notes?: string) => Promise<boolean>;
  updateDeliveryStatus: (orderId: string, status: DeliveryStatus, manualReference?: string, notes?: string) => Promise<boolean>;
  adjustStock: (productId: string, newQuantity: number, reason: string) => Promise<void>;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  addMarquee: (item: Omit<MarqueeItem, "id">) => Promise<boolean>;
  deleteMarquee: (id: string) => Promise<boolean>;
  updateHomepageSections: (sections: HomepageSection[]) => Promise<boolean>;
  refreshBackendData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [settings, setSettings] = useState<StoreSettings>(initialStoreSettings);
  const [marquees, setMarquees] = useState<MarqueeItem[]>(initialMarquees);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(initialHomepageSections);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(false);

  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  // Coupons
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Load local session on mount
  useEffect(() => {
    (async () => {
      try {
        const storedFavs = localStorage.getItem("satya_favorites");
        if (storedFavs) {
          setFavorites(JSON.parse(storedFavs));
        }

        const storedUser = localStorage.getItem("satya_customer_user");
        if (storedUser && storedUser !== "undefined") {
          try {
            const u = JSON.parse(storedUser);
            // Session cookie is HttpOnly; verify it's still valid before trusting the cached profile
            const res = await fetch(`/api/users/${u.id}`);
            if (res.ok) {
              const data = await res.json();
              setCurrentUser(data.user);
              if (data.user?.favorites) setFavorites(data.user.favorites);
            } else {
              localStorage.removeItem("satya_customer_user");
            }
          } catch {
            localStorage.removeItem("satya_customer_user");
          }
        }

        const storedAdmin = localStorage.getItem("satya_admin_auth");
        if (storedAdmin === "true") {
          fetch("/api/admin/profile")
            .then((res) => {
              if (res.ok) setIsAdminAuthenticated(true);
              else localStorage.removeItem("satya_admin_auth");
            })
            .catch(() => localStorage.removeItem("satya_admin_auth"));
        }

        const storedCart = localStorage.getItem("satya_cart");
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch (e) {
        console.warn("Could not read local storage session:", e);
      }
    })();
  }, []);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem("satya_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Save favorites to local storage
  useEffect(() => {
    try {
      localStorage.setItem("satya_favorites", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  // Fetch live backend data
  const refreshBackendData = useCallback(async () => {
    try {
      const fetchWithTimeout = (url: string, ms = 8000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
      };

      const [prodRes, catRes, ordRes, setRes, marqRes, layRes, promoRes] = await Promise.allSettled([
        fetchWithTimeout("/api/products"),
        fetchWithTimeout("/api/categories"),
        fetchWithTimeout("/api/orders"),
        fetchWithTimeout("/api/settings"),
        fetchWithTimeout("/api/marquees"),
        fetchWithTimeout("/api/layout"),
        fetchWithTimeout("/api/promotions"),
      ]);

      if (prodRes.status === "fulfilled" && prodRes.value.ok) {
        const data = await prodRes.value.json();
        setProducts(data.products || []);
      }

      if (catRes.status === "fulfilled" && catRes.value.ok) {
        const data = await catRes.value.json();
        setCategories(data.categories || []);
      }

      if (ordRes.status === "fulfilled" && ordRes.value.ok) {
        const data = await ordRes.value.json();
        setOrders(data.orders || []);
      }

      if (setRes.status === "fulfilled" && setRes.value.ok) {
        const data = await setRes.value.json();
        if (data.settings) setSettings(data.settings);
      }

      if (marqRes.status === "fulfilled" && marqRes.value.ok) {
        const data = await marqRes.value.json();
        setMarquees(data.marquees || []);
      }

      if (layRes.status === "fulfilled" && layRes.value.ok) {
        const data = await layRes.value.json();
        setHomepageSections(data.sections || []);
      }

      if (promoRes.status === "fulfilled" && promoRes.value.ok) {
        const data = await promoRes.value.json();
        setPromotions(data.promotions || []);
      }
    } catch (err) {
      console.warn("Backend sync failed; local data used:", err);
    } finally {
      setIsLoadingBackend(false);
    }
  }, []);

  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  // ==========================================
  // CART ACTIONS
  // ==========================================
  const addToCart = (product: Product, variantSku?: string, quantity: number = 1) => {
    const available = product.stockQuantity - product.reservedQuantity;
    if (available <= 0) {
      toast.error(`"${product.productName}" is currently out of stock.`);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.productId === product.id && it.variantSku === variantSku
      );

      if (existingIdx > -1) {
        const currentQty = prev[existingIdx].quantity;
        if (currentQty + quantity > available) {
          toast.warning(`Only ${available} units available in stock.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        toast.success(`Updated quantity of ${product.productName}`);
        return updated;
      }

      toast.success(`Added ${product.productName} to cart`);
      return [
        ...prev,
        {
          productId: product.id,
          variantSku,
          quantity,
          unitPrice: product.sellingPrice,
          product,
        },
      ];
    });
  };

  const removeFromCart = (productId: string, variantSku?: string) => {
    setCart((prev) => prev.filter((it) => !(it.productId === productId && it.variantSku === variantSku)));
    toast.info("Item removed from cart");
  };

  const updateCartQuantity = (productId: string, quantity: number, variantSku?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantSku);
      return;
    }
    setCart((prev) =>
      prev.map((it) => {
        if (it.productId === productId && it.variantSku === variantSku) {
          return { ...it, quantity };
        }
        return it;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // ==========================================
  // COUPON ACTIONS
  // ==========================================
  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: cartTotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Invalid coupon code");
        return { success: false, error: data.error };
      }

      setAppliedCoupon(data.coupon);
      setDiscountAmount(data.discount);
      toast.success(`Coupon "${code.toUpperCase()}" applied! Saved ₹${data.discount.toLocaleString("en-IN")}`);
      return { success: true, discount: data.discount };
    } catch {
      // Local fallback
      const found = initialCoupons.find((c) => c.code.toUpperCase() === code.toUpperCase().trim() && c.status === "active");
      if (!found) {
        toast.error("Invalid coupon code");
        return { success: false, error: "Invalid coupon" };
      }
      let disc = found.discountType === "fixed" ? found.discountValue : (cartTotal * found.discountValue) / 100;
      if (found.maxDiscountAmount) disc = Math.min(disc, found.maxDiscountAmount);
      disc = Math.min(disc, cartTotal);
      setAppliedCoupon(found);
      setDiscountAmount(disc);
      toast.success(`Coupon applied! Saved ₹${disc.toLocaleString("en-IN")}`);
      return { success: true, discount: disc };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    toast.info("Coupon removed");
  };

  // ==========================================
  // ORDER ACTIONS
  // ==========================================
  const createOrder = async (orderData: {
    recipientName: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    paymentMethod: "RAZORPAY" | "UPI" | "BANK_TRANSFER";
  }): Promise<Order | null> => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return null;
    }

    try {
      const itemsPayload = cart.map((it) => ({
        productId: it.productId,
        productName: it.product.productName,
        sku: it.product.sku,
        variantSku: it.variantSku,
        variantDescription: it.variantSku,
        unitPrice: it.unitPrice,
        mrp: it.product.mrp,
        quantity: it.quantity,
        image: it.product.images[0] || "",
      }));

      const addressPayload = {
        id: `addr-${Date.now()}`,
        userId: currentUser?.id || "guest",
        recipientName: orderData.recipientName,
        mobileNumber: orderData.mobileNumber,
        addressLine1: orderData.addressLine1,
        addressLine2: orderData.addressLine2,
        city: orderData.city,
        state: orderData.state,
        postalCode: orderData.postalCode,
        isDefault: true,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsPayload,
          address: addressPayload,
          paymentMethod: orderData.paymentMethod,
          userId: currentUser?.id,
          customerEmail: currentUser?.email,
          couponCode: appliedCoupon?.code,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to create order");
        return null;
      }

      setOrders((prev) => [data.order, ...prev]);
      clearCart();
      refreshBackendData();
      return data.order;
    } catch {
      toast.error("Could not create your order. Please try again when the server is available.");
      return null;
    }
  };

  const submitPaymentDetails = async (
    orderId: string,
    utr: string,
    evidenceUrl?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utr, evidenceUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to submit UTR reference");
        return false;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentReference: utr, paymentStatus: "Verification Pending" } : o))
      );
      toast.success("UTR Reference submitted! Our verification desk will review it shortly.");
      return true;
    } catch {
      toast.error("Could not submit payment details. Please try again.");
      return false;
    }
  };

  // ==========================================
  // RAZORPAY PAYMENT GATEWAY & REFUND ACTIONS
  // ==========================================
  const initiateRazorpayPayment = async (
    order: Order
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Ensure Razorpay Checkout script is loaded
      const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
          if (window.Razorpay) return resolve(true);
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Could not load Razorpay payment gateway. Please check internet connection.");
        return { success: false, error: "Razorpay script failed to load" };
      }

      // 2. Create Razorpay order on backend
      const res = await fetch(`/api/orders/${order.id}/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.razorpayOrder) {
        toast.error(data.error || "Failed to initialize Razorpay transaction.");
        return { success: false, error: data.error };
      }

      const keyId = data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_satyaStore123";

      // 3. Open Razorpay payment modal
      return new Promise((resolve) => {
        const options = {
          key: keyId,
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency || "INR",
          name: "Satya Stores",
          description: `Order #${order.orderNumber} Payment`,
          order_id: data.razorpayOrder.id,
          image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80",
          prefill: {
            name: order.customerName || currentUser?.fullName || "",
            email: order.customerEmail || currentUser?.email || "customer@example.com",
            contact: order.customerMobile || currentUser?.mobileNumber || "",
          },
          theme: {
            color: "#2563EB",
          },
          modal: {
            ondismiss: function () {
              toast.info("Payment window closed. You can complete payment anytime from your account.");
              resolve({ success: false, error: "Payment dismissed by user" });
            },
          },
          handler: async function (response: RazorpayPaymentResponse) {
            try {
              toast.loading("Verifying payment with bank...", { id: "rzp-verify" });
              const verifyRes = await fetch(`/api/orders/${order.id}/razorpay/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              toast.dismiss("rzp-verify");

              if (verifyRes.ok && verifyData.success) {
                toast.success("Payment verified! Your order is officially confirmed.");
                setOrders((prev) =>
                  prev.map((o) => (o.id === order.id ? verifyData.order : o))
                );
                refreshBackendData();
                resolve({ success: true });
              } else {
                toast.error(verifyData.error || "Payment verification could not be confirmed");
                resolve({ success: false, error: verifyData.error });
              }
            } catch (err: unknown) {
              toast.dismiss("rzp-verify");
              const message = err instanceof Error ? err.message : "Error validating payment";
              toast.error(message);
              resolve({ success: false, error: message });
            }
          },
        };

        if (!window.Razorpay) {
          resolve({ success: false, error: "Razorpay checkout is unavailable" });
          return;
        }
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (failResponse: RazorpayFailureResponse) {
          toast.error(failResponse.error?.description || "Payment failed or declined by bank.");
          resolve({ success: false, error: failResponse.error?.description });
        });
        rzp.open();
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initialize Razorpay checkout";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const processRefund = async (
    orderId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to process refund");
        return { success: false, error: data.error };
      }
      toast.success(
        `Refund of ₹${(data.order.refundAmount || 0).toLocaleString()} successfully processed via Razorpay!`
      );
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      refreshBackendData();
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error processing refund";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const fetchSettlements = useCallback(async (): Promise<RazorpaySettlement[]> => {
    try {
      const res = await fetch("/api/admin/settlements");
      const data = await res.json();
      if (res.ok && data.success) {
        return data.settlements;
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  // ==========================================
  // CUSTOMER AUTH
  // ==========================================
  const loginCustomer = async (emailOrPhone: string, passwordAttempt: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password: passwordAttempt }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Login failed");
        return { success: false, error: data.error };
      }

      setCurrentUser(data.user);
      if (data.user.favorites) setFavorites(data.user.favorites);
      localStorage.setItem("satya_customer_user", JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.fullName}!`);
      return { success: true };
    } catch {
      toast.error("Network error during login");
      return { success: false, error: "Network error" };
    }
  };

  const signupCustomer = async (
    fullName: string,
    email: string,
    mobileNumber: string,
    password: string
  ) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, mobileNumber, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Registration failed");
        return { success: false, error: data.error };
      }

      setCurrentUser(data.user);
      localStorage.setItem("satya_customer_user", JSON.stringify(data.user));
      toast.success("Account created successfully!");
      return { success: true };
    } catch {
      toast.error("Network error during registration");
      return { success: false, error: "Network error" };
    }
  };

  const logoutCustomer = () => {
    void fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setCurrentUser(null);
    localStorage.removeItem("satya_customer_user");
    toast.info("Signed out of your customer account");
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        localStorage.setItem("satya_customer_user", JSON.stringify(data.user));
        toast.success("Profile updated successfully!");
        return true;
      }
      toast.error(data.error || "Profile could not be saved to the database.");
      return false;
    } catch {}
    toast.error("Profile could not be saved to the database. Check your connection and try again.");
    return false;
  };

  const toggleFavorite = async (productId: string) => {
    const isFav = favorites.includes(productId);
    const newFavs = isFav ? favorites.filter((id) => id !== productId) : [...favorites, productId];
    setFavorites(newFavs);

    if (currentUser) {
      try {
        await fetch(`/api/users/${currentUser.id}/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
      } catch {}
    }

    toast.info(isFav ? "Removed from favorites" : "Added to favorites ❤️");
  };

  const submitReview = async (productId: string, rating: number, title: string, comment: string) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          userId: currentUser?.id || "guest",
          userName: currentUser?.fullName || "Verified Buyer",
          rating,
          title,
          comment,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Review submitted! Thank you for your feedback.");
        refreshBackendData();
        return true;
      }
    } catch {}
    toast.error("Could not submit the review. Please try again.");
    return false;
  };

  const fetchProductReviews = async (productId: string): Promise<Review[]> => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();
      if (res.ok && data.reviews) return data.reviews;
    } catch {}
    return [];
  };

  const requestPasswordReset = async (
    emailOrPhone: string
  ): Promise<{ success: boolean; message?: string; simulatedOtp?: string; error?: string }> => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Verification code dispatched!");
        return { success: true, message: data.message, simulatedOtp: data.simulatedOtp };
      }
      toast.error(data.error || "Could not request password reset");
      return { success: false, error: data.error };
    } catch {
      toast.error("Network error during reset request");
      return { success: false, error: "Network error" };
    }
  };

  const resetPasswordWithOtp = async (
    emailOrPhone: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Password updated successfully!");
        return { success: true, message: data.message };
      }
      toast.error(data.error || "Failed to reset password");
      return { success: false, error: data.error };
    } catch {
      toast.error("Network error resetting password");
      return { success: false, error: "Network error" };
    }
  };

  // ==========================================
  // ADMIN AUTH & CONTROLS
  // ==========================================
  const adminLogin = async (password: string, usernameOrEmail: string = "admin@sathyastores.com") => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: usernameOrEmail, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Invalid administrative credentials");
        return { success: false, error: data.error };
      }

      setIsAdminAuthenticated(true);
      localStorage.setItem("satya_admin_auth", "true");
      toast.success("Welcome, Store Administrator!");
      return { success: true };
    } catch {
      return { success: false, error: "Could not reach the sign-in service. Please try again." };
    }
  };

  const adminLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("satya_admin_auth");
    toast.info("Logged out of Admin Portal");
    }
  };

  const fetchAdminUsers = useCallback(async (search?: string) => {
    try {
      const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : "/api/admin/users";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.users) {
        setAdminUsers(data.users);
      }
    } catch {}
  }, []);

  const adminUpdateUserPassword = async (userId: string, newPass: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update user password");
        return false;
      }
      toast.success("User password successfully updated!");
      return true;
    } catch {
      toast.error("Network error");
      return false;
    }
  };

  const adminCreateUser = async (userData: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password?: string;
    role?: "customer" | "admin";
    accountStatus?: "active" | "suspended";
  }): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to create user");
        return false;
      }
      toast.success("User created successfully!");
      if (data.user) {
        setAdminUsers((prev) => [data.user, ...prev]);
      }
      return true;
    } catch {
      toast.error("Network error creating user");
      return false;
    }
  };

  const adminUpdateUser = async (
    id: string,
    updates: Partial<{
      fullName: string;
      email: string;
      mobileNumber: string;
      role: "customer" | "admin";
      accountStatus: "active" | "suspended";
    }>
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update user");
        return false;
      }
      toast.success("User details updated successfully!");
      setAdminUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
      return true;
    } catch {
      toast.error("Network error updating user");
      return false;
    }
  };

  const adminDeleteUser = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to delete user");
        return false;
      }
      toast.success("User removed successfully!");
      setAdminUsers((prev) => prev.filter((u) => u.id !== id));
      return true;
    } catch {
      toast.error("Network error deleting user");
      return false;
    }
  };

  const fetchAdmin2faSetup = useCallback(async (): Promise<{
    success: boolean;
    secret: string;
    otpauthUri: string;
    provider: string;
  } | null> => {
    try {
      const res = await fetch("/api/admin/2fa-setup");
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      }
    } catch {}
    return null;
  }, []);

  const verifyAdmin2faCode = async (code: string): Promise<{
    success: boolean;
    valid: boolean;
    method?: string;
    error?: string;
  }> => {
    try {
      const res = await fetch("/api/admin/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, valid: false, error: "Network error verifying 2FA" };
    }
  };

  const fetchAdminProfile = useCallback(async (): Promise<AdminProfile | null> => {
    try {
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      if (res.ok && data.profile) {
        setAdminProfile(data.profile);
        return data.profile;
      }
    } catch {}
    return null;
  }, []);

  const updateAdminProfile = async (updates: Partial<AdminProfile>): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminProfile(data.profile);
        toast.success("Admin Profile saved successfully!");
        return true;
      }
      toast.error(data.error || "Failed to update admin profile");
      return false;
    } catch {
      toast.error("Network error updating profile");
      return false;
    }
  };

  const generateAdmin2fa = async (): Promise<{ success: boolean; otp?: string; message?: string }> => {
    try {
      const res = await fetch("/api/admin/generate-2fa", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.info(data.message || `2FA Code: ${data.otp}`);
        return { success: true, otp: data.otp, message: data.message };
      }
      toast.error(data.error || "Failed to generate 2FA code");
      return { success: false };
    } catch {
      return { success: false };
    }
  };

  const adminChangePasswordWith2FA = async (
    currentPassword: string,
    newPassword: string,
    twoFactorCode: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, twoFactorCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Admin password successfully updated with 2FA verification!");
        return { success: true };
      }
      toast.error(data.error || "Failed to update password");
      return { success: false, error: data.error };
    } catch {
      toast.error("Network error updating password");
      return { success: false, error: "Network error" };
    }
  };

  const uploadImage = async (
    fileName: string,
    fileData: string
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, fileData }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        return { success: true, url: data.url };
      }
      return { success: false, error: data.error || "Image upload failed." };
    } catch {
      return { success: false, error: "Image upload failed. Check your connection and try again." };
    }
  };

  // ==========================================
  // ADMIN CATALOG & CMS ACTIONS
  // ==========================================
  const addProduct = async (productData: Omit<Product, "id">): Promise<boolean> => {
    if (!productData.images || productData.images.length < 2) {
      toast.error("Please provide at least 2 images for the product (Maximum: 10).");
      return false;
    }
    if (productData.images.length > 10) {
      toast.error("A product cannot have more than 10 images.");
      return false;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to add product to catalog.");
        return false;
      }

      setProducts((prev) => [data.product, ...prev]);
      toast.success(`Product "${productData.productName}" added!`);
      return true;
    } catch {
      toast.error("Network error adding product. Please try again.");
      return false;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
    if (updates.images !== undefined) {
      if (!Array.isArray(updates.images) || updates.images.length < 2) {
        toast.error("Product image validation failed: Minimum 2 images are required.");
        return false;
      }
      if (updates.images.length > 10) {
        toast.error("Product image validation failed: Maximum 10 images are allowed.");
        return false;
      }
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update product");
        return false;
      }
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      toast.success("Product updated successfully!");
      await refreshBackendData();
      return true;
    } catch {
      toast.error("Network error updating product. Please try again.");
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to delete product");
        return false;
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch {
      toast.error("Network error deleting product. Please try again.");
      return false;
    }
  };

  const restoreProduct = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success && data.product) {
        setProducts((prev) => {
          if (prev.some((p) => p.id === id)) return prev;
          return [data.product, ...prev];
        });
        toast.success(`Product "${data.product.productName}" restored to catalog!`);
        return true;
      } else {
        toast.error(data.error || "Unable to restore product.");
        return false;
      }
    } catch {
      toast.error("Network error restoring product");
      return false;
    }
  };

  const addCategory = async (categoryData: Omit<Category, "id">): Promise<boolean> => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories((prev) => [...prev, data.category]);
        toast.success(`Category "${categoryData.name}" created!`);
        await refreshBackendData();
        return true;
      }
      toast.error(data.error || "Failed to create category.");
      return false;
    } catch {
      toast.error("Network error creating category. Please try again.");
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to delete category.");
        return false;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.info("Category deleted");
      await refreshBackendData();
      return true;
    } catch {
      toast.error("Network error deleting category. Please try again.");
      return false;
    }
  };

  const verifyPayment = async (orderId: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to verify payment");
        return false;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "Verified", orderStatus: "Order Confirmed" } : o))
      );
      toast.success("Payment verified! Order confirmed & stock committed.");
      refreshBackendData();
      return true;
    } catch {
      toast.error("Network error verifying payment. Please try again.");
      return false;
    }
  };

  const rejectPayment = async (orderId: string, reason: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/payments/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to reject payment");
        return false;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "Rejected", rejectionReason: reason } : o))
      );
      toast.error(`Payment rejected: ${reason}`);
      refreshBackendData();
      return true;
    } catch {
      toast.error("Network error rejecting payment. Please try again.");
      return false;
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status?: OrderStatus,
    deliveryStatus?: DeliveryStatus,
    manualRef?: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: status,
          deliveryStatus,
          manualDeliveryReference: manualRef,
          deliveryNotes: notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update order status.");
        return false;
      }

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              orderStatus: status || o.orderStatus,
              deliveryStatus: deliveryStatus || o.deliveryStatus,
              manualDeliveryReference: manualRef || o.manualDeliveryReference,
              deliveryNotes: notes || o.deliveryNotes,
            };
          }
          return o;
        })
      );
      if (status) toast.success(`Order status updated to: ${status}`);
      else toast.success("Delivery details updated");
      return true;
    } catch {
      toast.error("Network error updating order. Please try again.");
      return false;
    }
  };

  const updateDeliveryStatus = async (
    orderId: string,
    status: DeliveryStatus,
    manualReference?: string,
    notes?: string
  ): Promise<boolean> => {
    // undefined orderStatus leaves the existing order stage untouched
    return updateOrderStatus(orderId, undefined, status, manualReference, notes);
  };

  const adjustStock = async (productId: string, newQuantity: number, reason: string) => {
    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          newQuantity,
          reason,
          performedBy: currentUser?.fullName || "Store Owner",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to adjust inventory.");
        return;
      }
      await refreshBackendData();
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newQuantity } : p))
      );
      toast.success("Inventory adjusted successfully");
    } catch {
      toast.error("Network error adjusting inventory. Please try again.");
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update store settings.");
        return;
      }
      if (data.settings) setSettings(data.settings);
      await refreshBackendData();
      setSettings((prev) => ({ ...prev, ...newSettings }));
      toast.success("Store settings updated");
    } catch {
      toast.error("Network error updating settings. Please try again.");
    }
  };

  const addMarquee = async (item: Omit<MarqueeItem, "id">): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/marquees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMarquees((prev) => [...prev, data.marquee]);
        toast.success("Marquee ticker published!");
        return true;
      }
      toast.error(data.error || "Failed to publish marquee ticker.");
      return false;
    } catch {
      toast.error("Network error publishing marquee. Please try again.");
      return false;
    }
  };

  const deleteMarquee = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/marquees/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to remove marquee ticker.");
        return false;
      }
      setMarquees((prev) => prev.filter((m) => m.id !== id));
      toast.info("Marquee removed");
      return true;
    } catch {
      toast.error("Network error removing marquee. Please try again.");
      return false;
    }
  };

  const updateHomepageSections = async (sections: HomepageSection[]): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to save homepage layout.");
        return false;
      }
      setHomepageSections(sections);
      toast.success("Homepage layout preview updated!");
      return true;
    } catch {
      toast.error("Network error saving layout. Please try again.");
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        cart,
        orders,
        promotions,
        settings,
        currentUser,
        isAdminAuthenticated,
        favorites,
        appliedCoupon,
        discountAmount,
        marquees,
        homepageSections,
        isLoadingBackend,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,
        applyCoupon,
        removeCoupon,
        createOrder,
        submitPaymentDetails,
        initiateRazorpayPayment,
        processRefund,
        fetchSettlements,
        loginCustomer,
        signupCustomer,
        logoutCustomer,
        updateProfile,
        toggleFavorite,
        submitReview,
        fetchProductReviews,
        requestPasswordReset,
        resetPasswordWithOtp,
        adminLogin,
        adminLogout,
        adminUsers,
        fetchAdminUsers,
        adminCreateUser,
        adminUpdateUser,
        adminDeleteUser,
        adminUpdateUserPassword,
        adminProfile,
        fetchAdminProfile,
        updateAdminProfile,
        fetchAdmin2faSetup,
        verifyAdmin2faCode,
        generateAdmin2fa,
        adminChangePasswordWith2FA,
        uploadImage,
        addProduct,
        updateProduct,
        deleteProduct,
        restoreProduct,
        addCategory,
        deleteCategory,
        verifyPayment,
        rejectPayment,
        updateOrderStatus,
        updateDeliveryStatus,
        adjustStock,
        updateSettings,
        addMarquee,
        deleteMarquee,
        updateHomepageSections,
        refreshBackendData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
