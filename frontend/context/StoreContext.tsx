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
  InventoryMovement,
  OrderStatus,
  DeliveryStatus,
  Coupon,
  MarqueeItem,
  Review,
  HomepageSection,
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
  inventoryMovements: InventoryMovement[];
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
    paymentMethod: "UPI" | "BANK_TRANSFER";
  }) => Promise<Order | null>;
  submitPaymentDetails: (orderId: string, utr: string, evidenceUrl?: string) => Promise<boolean>;

  // Customer Auth & Profile
  loginCustomer: (emailOrPhone: string, passwordAttempt: string) => Promise<{ success: boolean; error?: string }>;
  signupCustomer: (fullName: string, email: string, mobileNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutCustomer: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  toggleFavorite: (productId: string) => Promise<void>;
  submitReview: (productId: string, rating: number, title: string, comment: string) => Promise<boolean>;
  fetchProductReviews: (productId: string) => Promise<Review[]>;

  // Admin Auth & Management
  adminLogin: (password: string, usernameOrEmail?: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
  adminUsers: User[];
  fetchAdminUsers: (search?: string) => Promise<void>;
  adminUpdateUserPassword: (userId: string, newPass: string) => Promise<boolean>;

  // Admin Catalog & Operations
  addProduct: (product: Omit<Product, "id">) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  addCategory: (category: Omit<Category, "id">) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  verifyPayment: (orderId: string) => Promise<boolean>;
  rejectPayment: (orderId: string, reason: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus, deliveryStatus?: DeliveryStatus, manualRef?: string, notes?: string) => Promise<boolean>;
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
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(true);

  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  // Coupons
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Load local session on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("satya_customer_user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        setCurrentUser(u);
        if (u.favorites) setFavorites(u.favorites);
      }

      const storedAdmin = localStorage.getItem("satya_admin_auth");
      if (storedAdmin === "true") {
        setIsAdminAuthenticated(true);
      }

      const storedCart = localStorage.getItem("satya_cart");
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }

      const storedFavs = localStorage.getItem("satya_favorites");
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs));
      }
    } catch (e) {
      console.warn("Could not read local storage session:", e);
    }
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
      setIsLoadingBackend(true);
      const [prodRes, catRes, ordRes, setRes, marqRes, layRes] = await Promise.allSettled([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/orders"),
        fetch("/api/settings"),
        fetch("/api/marquees"),
        fetch("/api/layout"),
      ]);

      if (prodRes.status === "fulfilled" && prodRes.value.ok) {
        const data = await prodRes.value.json();
        if (data.products && data.products.length > 0) setProducts(data.products);
      }

      if (catRes.status === "fulfilled" && catRes.value.ok) {
        const data = await catRes.value.json();
        if (data.categories && data.categories.length > 0) setCategories(data.categories);
      }

      if (ordRes.status === "fulfilled" && ordRes.value.ok) {
        const data = await ordRes.value.json();
        if (data.orders) setOrders(data.orders);
      }

      if (setRes.status === "fulfilled" && setRes.value.ok) {
        const data = await setRes.value.json();
        if (data.settings) setSettings(data.settings);
      }

      if (marqRes.status === "fulfilled" && marqRes.value.ok) {
        const data = await marqRes.value.json();
        if (data.marquees && data.marquees.length > 0) setMarquees(data.marquees);
      }

      if (layRes.status === "fulfilled" && layRes.value.ok) {
        const data = await layRes.value.json();
        if (data.sections && data.sections.length > 0) setHomepageSections(data.sections);
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
    paymentMethod: "UPI" | "BANK_TRANSFER";
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
          discount: discountAmount,
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
      // Local fallback
      const orderNumber = `SAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const shippingCharge = cartTotal >= settings.freeShippingThreshold ? 0 : settings.standardShippingFee;
      const totalAmount = Math.max(0, cartTotal - discountAmount + shippingCharge);

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber,
        userId: currentUser?.id || "guest",
        customerName: orderData.recipientName,
        customerMobile: orderData.mobileNumber,
        customerEmail: currentUser?.email || "customer@example.com",
        itemsSnapshot: cart.map((it) => ({
          productId: it.productId,
          productName: it.product.productName,
          sku: it.product.sku,
          variantSku: it.variantSku,
          unitPrice: it.unitPrice,
          mrp: it.product.mrp,
          quantity: it.quantity,
          image: it.product.images[0] || "",
        })),
        shippingAddressSnapshot: {
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
        },
        subtotal: cartTotal,
        discount: discountAmount,
        shippingCharge,
        totalAmount,
        orderStatus: "Order Created",
        paymentStatus: "Awaiting Payment",
        deliveryStatus: "Not Arranged",
        paymentMethod: orderData.paymentMethod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setOrders((prev) => [newOrder, ...prev]);
      clearCart();
      return newOrder;
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
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentReference: utr, paymentStatus: "Verification Pending" } : o))
      );
      toast.success("UTR Reference recorded locally.");
      return true;
    }
  };

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
    } catch {}
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem("satya_customer_user", JSON.stringify(updated));
    toast.success("Profile saved locally!");
    return true;
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
    toast.success("Review recorded!");
    return true;
  };

  const fetchProductReviews = async (productId: string): Promise<Review[]> => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();
      if (res.ok && data.reviews) return data.reviews;
    } catch {}
    return [];
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
      // Local check fallback
      if (password === "admin123" || password === "admin") {
        setIsAdminAuthenticated(true);
        localStorage.setItem("satya_admin_auth", "true");
        toast.success("Admin authorized (Local mode)");
        return { success: true };
      }
      return { success: false, error: "Incorrect password" };
    }
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("satya_admin_auth");
    toast.info("Logged out of Admin Portal");
  };

  const fetchAdminUsers = async (search?: string) => {
    try {
      const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : "/api/admin/users";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.users) {
        setAdminUsers(data.users);
      }
    } catch {}
  };

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

  // ==========================================
  // ADMIN CATALOG & CMS ACTIONS
  // ==========================================
  const addProduct = async (productData: Omit<Product, "id">): Promise<boolean> => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => [data.product, ...prev]);
        toast.success(`Product "${productData.productName}" added!`);
        return true;
      }
    } catch {}
    const newProd = { ...productData, id: `prod-${Date.now()}` } as Product;
    setProducts((prev) => [newProd, ...prev]);
    toast.success(`Product added locally!`);
    return true;
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
    try {
      await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await refreshBackendData();
    } catch {}
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    toast.success("Product updated successfully");
    return true;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      await refreshBackendData();
    } catch {}
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.info("Product removed from catalog");
    return true;
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
    } catch {}
    const newCat = { ...categoryData, id: `cat-${Date.now()}` } as Category;
    setCategories((prev) => [...prev, newCat]);
    toast.success(`Category created locally!`);
    return true;
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      await refreshBackendData();
    } catch {}
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.info("Category deleted");
    return true;
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
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "Verified", orderStatus: "Order Confirmed" } : o))
      );
      toast.success("Payment verified locally");
      return true;
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
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "Rejected", rejectionReason: reason } : o))
      );
      toast.error(`Payment rejected locally: ${reason}`);
      return true;
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    deliveryStatus?: DeliveryStatus,
    manualRef?: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: status,
          deliveryStatus,
          manualDeliveryReference: manualRef,
          deliveryNotes: notes,
        }),
      });
    } catch {}

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: status,
            deliveryStatus: deliveryStatus || o.deliveryStatus,
            manualDeliveryReference: manualRef || o.manualDeliveryReference,
            deliveryNotes: notes || o.deliveryNotes,
          };
        }
        return o;
      })
    );
    toast.success(`Order status updated to: ${status}`);
    return true;
  };

  const updateDeliveryStatus = async (
    orderId: string,
    status: DeliveryStatus,
    manualReference?: string,
    notes?: string
  ): Promise<boolean> => {
    return updateOrderStatus(orderId, "Processing", status, manualReference, notes);
  };

  const adjustStock = async (productId: string, newQuantity: number, reason: string) => {
    try {
      await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, newQuantity, reason, adminName: "Admin" }),
      });
      await refreshBackendData();
    } catch {}
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newQuantity } : p))
    );
    toast.success("Inventory adjusted successfully");
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      await refreshBackendData();
    } catch {}
    setSettings((prev) => ({ ...prev, ...newSettings }));
    toast.success("Store settings updated");
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
    } catch {}
    const newM = { ...item, id: `marq-${Date.now()}` } as MarqueeItem;
    setMarquees((prev) => [...prev, newM]);
    toast.success("Marquee created locally!");
    return true;
  };

  const deleteMarquee = async (id: string): Promise<boolean> => {
    try {
      await fetch(`/api/admin/marquees/${id}`, { method: "DELETE" });
    } catch {}
    setMarquees((prev) => prev.filter((m) => m.id !== id));
    toast.info("Marquee removed");
    return true;
  };

  const updateHomepageSections = async (sections: HomepageSection[]): Promise<boolean> => {
    try {
      await fetch("/api/admin/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
    } catch {}
    setHomepageSections(sections);
    toast.success("Homepage layout preview updated!");
    return true;
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
        inventoryMovements,
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
        loginCustomer,
        signupCustomer,
        logoutCustomer,
        updateProfile,
        toggleFavorite,
        submitReview,
        fetchProductReviews,
        adminLogin,
        adminLogout,
        adminUsers,
        fetchAdminUsers,
        adminUpdateUserPassword,
        addProduct,
        updateProduct,
        deleteProduct,
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
