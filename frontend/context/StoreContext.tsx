"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
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
} from "@/types";
import {
  initialProducts,
  initialCategories,
  initialStoreSettings,
  initialOrders,
  initialPromotions,
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
  inventoryMovements: InventoryMovement[];
  isLoadingBackend: boolean;

  // Cart Actions
  addToCart: (product: Product, variantSku?: string, quantity?: number) => void;
  removeFromCart: (productId: string, variantSku?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, variantSku?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Checkout & Order Actions
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

  submitPaymentDetails: (
    orderId: string,
    utr: string,
    evidenceUrl?: string
  ) => Promise<boolean>;

  // Owner Management Actions
  verifyPayment: (orderId: string) => Promise<void>;
  rejectPayment: (orderId: string, reason: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateDeliveryStatus: (
    orderId: string,
    status: DeliveryStatus,
    manualReference?: string,
    notes?: string
  ) => Promise<void>;
  adjustStock: (
    productId: string,
    newQuantity: number,
    reason: string
  ) => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;

  // Auth / Role Switching
  loginAsCustomer: (name?: string, mobile?: string) => void;
  loginAsOwner: () => void;
  logout: () => void;
  refreshBackendData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const defaultCustomer: User = {
  id: "usr-cust-1",
  fullName: "Ramesh Sharma",
  email: "ramesh.sharma@example.com",
  mobileNumber: "+91 98765 43210",
  role: "customer",
  mobileVerified: true,
  emailVerified: true,
  accountStatus: "active",
  createdAt: "2026-11-01T00:00:00Z",
};

const defaultOwner: User = {
  id: "usr-owner-1",
  fullName: "Satya Store Owner",
  email: "owner@satyastores.in",
  mobileNumber: "+91 98490 12345",
  role: "owner",
  mobileVerified: true,
  emailVerified: true,
  accountStatus: "active",
  createdAt: "2026-10-01T00:00:00Z",
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [settings, setSettings] = useState<StoreSettings>(initialStoreSettings);
  const [currentUser, setCurrentUser] = useState<User | null>(defaultCustomer);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(false);

  // Sync with actual Backend API on mount
  const refreshBackendData = async () => {
    setIsLoadingBackend(true);
    try {
      const [prodRes, ordRes, setRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/orders"),
        fetch("/api/settings"),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.products && prodData.products.length > 0) {
          setProducts(prodData.products);
        }
      }

      if (ordRes.ok) {
        const ordData = await ordRes.json();
        if (ordData.orders && ordData.orders.length > 0) {
          setOrders(ordData.orders);
        }
      }

      if (setRes.ok) {
        const setData = await setRes.json();
        if (setData.settings) {
          setSettings(setData.settings);
        }
      }
    } catch {
      // Fallback to initial local state
    } finally {
      setIsLoadingBackend(false);
    }
  };

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("satya_cart");
      if (storedCart) setCart(JSON.parse(storedCart));

      const storedUser = localStorage.getItem("satya_user");
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
    } catch {
      // Ignore
    }

    refreshBackendData();
  }, []);

  // Save Cart updates to localStorage
  useEffect(() => {
    localStorage.setItem("satya_cart", JSON.stringify(cart));
  }, [cart]);

  // Cart Calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart Operations
  const addToCart = (product: Product, variantSku?: string, quantity: number = 1) => {
    const availableStock = product.stockQuantity - product.reservedQuantity;
    if (availableStock <= 0) {
      toast.error("Sorry, this item is currently out of stock.");
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === product.id && i.variantSku === variantSku
      );

      let price = product.sellingPrice;
      if (variantSku) {
        const variant = product.variants.find((v) => v.sku === variantSku);
        if (variant) price = variant.price;
      }

      if (existingIndex > -1) {
        const next = [...prev];
        const nextQty = next[existingIndex].quantity + quantity;
        if (nextQty > availableStock) {
          toast.warning(`Only ${availableStock} units available in stock.`);
          return prev;
        }
        next[existingIndex] = { ...next[existingIndex], quantity: nextQty };
        toast.success(`Updated quantity for ${product.productName}`);
        return next;
      } else {
        toast.success(`Added ${product.productName} to cart`);
        return [
          ...prev,
          {
            productId: product.id,
            variantSku,
            quantity,
            unitPrice: price,
            product,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: string, variantSku?: string) => {
    setCart((prev) =>
      prev.filter(
        (i) => !(i.productId === productId && i.variantSku === variantSku)
      )
    );
    toast.info("Item removed from cart");
  };

  const updateCartQuantity = (
    productId: string,
    quantity: number,
    variantSku?: string
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantSku);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId === productId && i.variantSku === variantSku) {
          return { ...i, quantity };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Order Placement & Backend Atomic Reservation
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
      toast.error("Your cart is empty.");
      return null;
    }

    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.productId,
        productName: item.product.productName,
        sku: item.product.sku,
        variantSku: item.variantSku,
        variantDescription: item.variantSku
          ? item.product.variants.find((v) => v.sku === item.variantSku)?.name
          : undefined,
        unitPrice: item.unitPrice,
        mrp: item.product.mrp,
        quantity: item.quantity,
        image: item.product.images[0] || "",
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsPayload,
          address: {
            ...orderData,
            userId: currentUser?.id || "guest-user",
            isDefault: true,
          },
          paymentMethod: orderData.paymentMethod,
          userId: currentUser?.id,
          customerEmail: currentUser?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to create order on backend");
        return null;
      }

      const newOrder = data.order as Order;
      setOrders((prev) => [newOrder, ...prev]);

      // Update reserved stock locally
      setProducts((prev) =>
        prev.map((prod) => {
          const match = cart.find((c) => c.productId === prod.id);
          if (match) {
            return {
              ...prod,
              reservedQuantity: prod.reservedQuantity + match.quantity,
            };
          }
          return prod;
        })
      );

      clearCart();
      toast.success(`Order ${newOrder.orderNumber} created & stored in database!`);
      return newOrder;
    } catch (err: any) {
      toast.error("Network error while creating order");
      return null;
    }
  };

  // Submit UTR Reference to Backend
  const submitPaymentDetails = async (
    orderId: string,
    utr: string,
    evidenceUrl?: string
  ): Promise<boolean> => {
    if (!utr || utr.trim().length < 6) {
      toast.error("Please enter a valid 12-digit UPI reference (UTR) or Bank reference number.");
      return false;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utr, evidenceUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to submit payment details");
        return false;
      }

      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? data.order : ord))
      );

      toast.success("Payment details saved in backend! Awaiting store owner verification.");
      return true;
    } catch {
      toast.error("Failed to connect to backend");
      return false;
    }
  };

  // Owner: Verify Payment on Backend
  const verifyPayment = async (orderId: string) => {
    try {
      const res = await fetch("/api/admin/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to verify payment on backend");
        return;
      }

      // Update order and refresh products to reflect finalized physical deduction
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? data.order : ord))
      );

      refreshBackendData();
      toast.success(`Payment VERIFIED in database.`);
    } catch {
      toast.error("Failed to connect to backend");
    }
  };

  // Owner: Reject Payment on Backend
  const rejectPayment = async (orderId: string, reason: string) => {
    try {
      const res = await fetch("/api/admin/payments/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to reject payment on backend");
        return;
      }

      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? data.order : ord))
      );

      refreshBackendData();
      toast.error(`Payment rejected in database: ${reason}`);
    } catch {
      toast.error("Failed to connect to backend");
    }
  };

  // Owner: Update Order Status
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? { ...ord, orderStatus: status, updatedAt: new Date().toISOString() }
          : ord
      )
    );
    toast.success(`Order status updated to "${status}"`);
  };

  // Owner: Update Delivery on Backend
  const updateDeliveryStatus = async (
    orderId: string,
    status: DeliveryStatus,
    manualReference?: string,
    notes?: string
  ) => {
    try {
      const res = await fetch("/api/admin/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          deliveryStatus: status,
          manualReference,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update delivery status");
        return;
      }

      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? data.order : ord))
      );
      toast.success(`Delivery status updated to "${status}" in backend.`);
    } catch {
      toast.error("Failed to connect to backend");
    }
  };

  // Owner: Manual Stock Adjustment on Backend
  const adjustStock = async (
    productId: string,
    newQuantity: number,
    reason: string
  ) => {
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
        toast.error(data.error || "Failed to adjust stock on backend");
        return;
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? data.product : p))
      );

      if (data.movement) {
        setInventoryMovements((m) => [data.movement, ...m]);
      }

      toast.success(`Stock updated to ${newQuantity} units in database.`);
    } catch {
      toast.error("Failed to connect to backend");
    }
  };

  // Add Product to Backend
  const addProduct = async (newProd: Omit<Product, "id">) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProd),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to add product to backend");
        return;
      }

      setProducts((prev) => [data.product, ...prev]);
      toast.success(`Product "${data.product.productName}" saved to database.`);
    } catch {
      toast.error("Failed to connect to backend");
    }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    toast.success("Product details updated.");
  };

  // Update Store Settings on Backend
  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to save settings");
        return;
      }

      setSettings(data.settings);
      toast.success("Store payment and delivery settings saved to database.");
    } catch {
      toast.error("Failed to connect to backend");
    }
  };

  // Role Switching Helpers
  const loginAsCustomer = (name?: string, mobile?: string) => {
    const user = {
      ...defaultCustomer,
      fullName: name || defaultCustomer.fullName,
      mobileNumber: mobile || defaultCustomer.mobileNumber,
    };
    setCurrentUser(user);
    localStorage.setItem("satya_user", JSON.stringify(user));
    toast.success(`Logged in as Customer: ${user.fullName}`);
  };

  const loginAsOwner = () => {
    setCurrentUser(defaultOwner);
    localStorage.setItem("satya_user", JSON.stringify(defaultOwner));
    toast.success("Owner Admin mode activated");
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("satya_user");
    toast.info("Logged out");
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
        inventoryMovements,
        isLoadingBackend,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,
        createOrder,
        submitPaymentDetails,
        verifyPayment,
        rejectPayment,
        updateOrderStatus,
        updateDeliveryStatus,
        adjustStock,
        addProduct,
        updateProduct,
        updateSettings,
        loginAsCustomer,
        loginAsOwner,
        logout,
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
