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
  PaymentStatus,
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
  }) => Order | null;
  submitPaymentDetails: (
    orderId: string,
    utr: string,
    evidenceUrl?: string
  ) => boolean;

  // Owner Management Actions
  verifyPayment: (orderId: string) => void;
  rejectPayment: (orderId: string, reason: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateDeliveryStatus: (
    orderId: string,
    status: DeliveryStatus,
    manualReference?: string,
    notes?: string
  ) => void;
  adjustStock: (
    productId: string,
    newQuantity: number,
    reason: string
  ) => void;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // Auth / Role Switching
  loginAsCustomer: (name?: string, mobile?: string) => void;
  loginAsOwner: () => void;
  logout: () => void;
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

  // Load persisted state from localStorage on client mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("satya_cart");
      if (storedCart) setCart(JSON.parse(storedCart));

      const storedOrders = localStorage.getItem("satya_orders");
      if (storedOrders) setOrders(JSON.parse(storedOrders));

      const storedProducts = localStorage.getItem("satya_products");
      if (storedProducts) setProducts(JSON.parse(storedProducts));

      const storedUser = localStorage.getItem("satya_user");
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
    } catch {
      // Ignore parse errors on first load
    }
  }, []);

  // Save Cart updates to localStorage
  useEffect(() => {
    localStorage.setItem("satya_cart", JSON.stringify(cart));
  }, [cart]);

  // Save Orders updates to localStorage
  useEffect(() => {
    localStorage.setItem("satya_orders", JSON.stringify(orders));
  }, [orders]);

  // Save Products updates to localStorage
  useEffect(() => {
    localStorage.setItem("satya_products", JSON.stringify(products));
  }, [products]);

  // Cart Calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart Operations
  const addToCart = (product: Product, variantSku?: string, quantity: number = 1) => {
    // Check stock
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

  // Order Placement & Concurrency-Safe Reservation
  const createOrder = (orderData: {
    recipientName: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    paymentMethod: "UPI" | "BANK_TRANSFER";
  }): Order | null => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return null;
    }

    // Validate stock for all items
    for (const item of cart) {
      const liveProduct = products.find((p) => p.id === item.productId);
      if (!liveProduct) {
        toast.error(`Product not found.`);
        return null;
      }
      const freeStock = liveProduct.stockQuantity - liveProduct.reservedQuantity;
      if (freeStock < item.quantity) {
        toast.error(
          `Insufficient stock for "${liveProduct.productName}". Only ${freeStock} left.`
        );
        return null;
      }
    }

    // Atomic Reservation: Increase reservedQuantity for all ordered products
    setProducts((prev) =>
      prev.map((prod) => {
        const cartMatch = cart.find((c) => c.productId === prod.id);
        if (cartMatch) {
          return {
            ...prod,
            reservedQuantity: prod.reservedQuantity + cartMatch.quantity,
          };
        }
        return prod;
      })
    );

    const subtotal = cartTotal;
    const shippingCharge =
      subtotal >= settings.freeShippingThreshold ? 0 : settings.standardShippingFee;
    const totalAmount = subtotal + shippingCharge;
    const newOrderNumber = `SAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNumber,
      userId: currentUser?.id || "guest-user",
      customerName: orderData.recipientName,
      customerMobile: orderData.mobileNumber,
      customerEmail: currentUser?.email || "customer@example.com",
      itemsSnapshot: cart.map((item) => ({
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
      })),
      shippingAddressSnapshot: {
        id: `addr-${Date.now()}`,
        userId: currentUser?.id || "guest-user",
        recipientName: orderData.recipientName,
        mobileNumber: orderData.mobileNumber,
        addressLine1: orderData.addressLine1,
        addressLine2: orderData.addressLine2,
        city: orderData.city,
        state: orderData.state,
        postalCode: orderData.postalCode,
        isDefault: true,
      },
      subtotal,
      discount: 0,
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
    toast.success(`Order ${newOrderNumber} created successfully! Please submit payment reference.`);
    return newOrder;
  };

  // Submit UTR Reference
  const submitPaymentDetails = (
    orderId: string,
    utr: string,
    evidenceUrl?: string
  ) => {
    if (!utr || utr.trim().length < 6) {
      toast.error("Please enter a valid 12-digit UPI reference (UTR) or Bank transaction number.");
      return false;
    }

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            paymentReference: utr.trim(),
            paymentEvidenceUrl: evidenceUrl || ord.paymentEvidenceUrl,
            paymentStatus: "Verification Pending",
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    toast.success("Payment details submitted! Awaiting store owner verification.");
    return true;
  };

  // Owner: Verify Payment
  const verifyPayment = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    // Finalize stock deduction: deduct stockQuantity and clear reservedQuantity
    setProducts((prev) =>
      prev.map((prod) => {
        const itemMatch = targetOrder.itemsSnapshot.find((i) => i.productId === prod.id);
        if (itemMatch) {
          return {
            ...prod,
            stockQuantity: Math.max(0, prod.stockQuantity - itemMatch.quantity),
            reservedQuantity: Math.max(0, prod.reservedQuantity - itemMatch.quantity),
          };
        }
        return prod;
      })
    );

    // Update Order & Payment Status
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            paymentStatus: "Verified",
            orderStatus: "Order Confirmed",
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    toast.success(`Payment for Order #${targetOrder.orderNumber} VERIFIED.`);
  };

  // Owner: Reject Payment
  const rejectPayment = (orderId: string, reason: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    // Release stock reservation
    setProducts((prev) =>
      prev.map((prod) => {
        const itemMatch = targetOrder.itemsSnapshot.find((i) => i.productId === prod.id);
        if (itemMatch) {
          return {
            ...prod,
            reservedQuantity: Math.max(0, prod.reservedQuantity - itemMatch.quantity),
          };
        }
        return prod;
      })
    );

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            paymentStatus: "Rejected",
            rejectionReason: reason,
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    toast.error(`Payment rejected for Order #${targetOrder.orderNumber}: ${reason}`);
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

  // Owner: Update Delivery Status
  const updateDeliveryStatus = (
    orderId: string,
    status: DeliveryStatus,
    manualReference?: string,
    notes?: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            deliveryStatus: status,
            manualDeliveryReference: manualReference || ord.manualDeliveryReference,
            deliveryNotes: notes || ord.deliveryNotes,
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );
    toast.success(`Delivery status updated to "${status}"`);
  };

  // Owner: Manual Stock Adjustment
  const adjustStock = (
    productId: string,
    newQuantity: number,
    reason: string
  ) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === productId) {
          const prevQty = prod.stockQuantity;
          const diff = newQuantity - prevQty;

          // Record movement
          const movement: InventoryMovement = {
            id: `mov-${Date.now()}`,
            productId: prod.id,
            productName: prod.productName,
            sku: prod.sku,
            movementType: "MANUAL_ADJUSTMENT",
            quantity: Math.abs(diff),
            previousQuantity: prevQty,
            newQuantity: newQuantity,
            reason: reason || "Manual stock count adjustment",
            performedBy: currentUser?.fullName || "Store Owner",
            createdAt: new Date().toISOString(),
          };
          setInventoryMovements((m) => [movement, ...m]);

          return {
            ...prod,
            stockQuantity: Math.max(0, newQuantity),
          };
        }
        return prod;
      })
    );
    toast.success(`Stock updated to ${newQuantity} units.`);
  };

  // Add Product
  const addProduct = (newProd: Omit<Product, "id">) => {
    const id = `prod-${Date.now()}`;
    const product: Product = { ...newProd, id };
    setProducts((prev) => [product, ...prev]);
    toast.success(`Product "${product.productName}" added to catalog.`);
  };

  // Update Product
  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    toast.success("Product details updated.");
  };

  // Update Store Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    toast.success("Store payment and delivery settings saved.");
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
