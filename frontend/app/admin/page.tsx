"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  ShieldCheck,
  CreditCard,
  Package,
  Layers,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Pencil,
  UserPlus,
  GripVertical,
  Undo2,
  Truck,
  RefreshCw,
  Search,
  Users,
  KeyRound,
  Volume2,
  Layout,
  MoveUp,
  MoveDown,
  Trash2,
  Lock,
  LogOut,
  Smartphone,
  ExternalLink,
  Database,
  RotateCcw,
  X,
  ArrowLeft,
  Home,
  Grid,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  DeliveryStatus,
  Product,
  HomepageSection,
  User,
  Order,
  RazorpaySettlement,
} from "@/types";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { ProfileImagePicker } from "@/components/profile/ProfileImagePicker";

export default function AdminDashboardPage() {
  const {
    products,
    categories,
    orders,
    settings,
    verifyPayment,
    rejectPayment,
    updateDeliveryStatus,
    adjustStock,
    addProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    addCategory,
    deleteCategory,
    updateSettings,
    adminLogin,
    adminLogout,
    isAdminAuthenticated,
    adminUsers,
    fetchAdminUsers,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser,
    adminUpdateUserPassword,
    marquees,
    addMarquee,
    deleteMarquee,
    homepageSections,
    updateHomepageSections,
    refreshBackendData,
    adminProfile,
    fetchAdminProfile,
    updateAdminProfile,
    adminPasskeys,
    fetchAdminPasskeys,
    revokeAdminPasskey,
    createAdminPasskeyEnrollmentCode,
    uploadImage,
    verifyAdmin2faCode,
    beginAdminTotpSetup,
    confirmAdminTotpSetup,
    beginAdminAuthenticatorReplacement,
    confirmAdminAuthenticatorReplacement,
    verifyAdminLoginTotp,
    completeAdminPasskey,
    approveAdminPasskeyEnrollment,
    adminChangePasswordWith2FA,
    processRefund,
    fetchSettlements,
  } = useStore();

  // Razorpay Payments, Refunds & Settlements State
  const [paymentsSubTab, setPaymentsSubTab] = useState<"razorpay" | "settlements" | "pending_utr">("razorpay");
  const [settlementsList, setSettlementsList] = useState<RazorpaySettlement[]>([]);
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);
  const [refundAmountInput, setRefundAmountInput] = useState<number>(0);
  const [refundReasonInput, setRefundReasonInput] = useState<string>("Customer requested cancellation");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Login form state
  const [adminEmail, setAdminEmail] = useState("admin@sathyastores.com");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminLoginStep, setAdminLoginStep] = useState<"password" | "totp-setup" | "totp" | "passkey">("password");
  const [loginTotpCode, setLoginTotpCode] = useState("");
  const [loginTotpSetup, setLoginTotpSetup] = useState<{ secret: string; qrCodeDataUrl: string; expiresAt: string } | null>(null);
  const [hasApprovedDevice, setHasApprovedDevice] = useState(false);
  const [deviceEnrollmentApproved, setDeviceEnrollmentApproved] = useState(false);
  const [deviceApprovalCode, setDeviceApprovalCode] = useState("");
  const [deviceName, setDeviceName] = useState("My approved device");

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "profile"
    | "users"
    | "payments"
    | "orders"
    | "products"
    | "categories"
    | "coupons"
    | "marquees"
    | "layout"
    | "inventory"
    | "settings"
  >("overview");

  // Admin Profile & 2FA State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editAdminName, setEditAdminName] = useState("Satya Narayana");
  const [editAdminEmail, setEditAdminEmail] = useState("admin@sathyastores.com");
  const [editAdminMobile, setEditAdminMobile] = useState("+91 98480 22338");
  const [editAdminEntity, setEditAdminEntity] = useState("Vasavi Enterprises");

  // Admin Password Change with 2FA
  const [adminCurrentPass, setAdminCurrentPass] = useState("");
  const [adminNewPass, setAdminNewPass] = useState("");
  const [adminConfirmPass, setAdminConfirmPass] = useState("");
  const [admin2faCode, setAdmin2faCode] = useState("");
  const [showAdminCurrentPass, setShowAdminCurrentPass] = useState(false);
  const [showAdminNewPass, setShowAdminNewPass] = useState(false);
  const [showAdminConfirmPass, setShowAdminConfirmPass] = useState(false);
  const [isUpdatingAdminPass, setIsUpdatingAdminPass] = useState(false);

  // User Management State
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  // Rejection Modal State
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Delivery Modal State
  const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null);
  const [deliveryReference, setDeliveryReference] = useState("");
  const [newDeliveryStatus, setNewDeliveryStatus] = useState<DeliveryStatus>("Dispatched");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Stock Adjustment State
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [adjustNewQty, setAdjustNewQty] = useState<number>(0);
  const [adjustReasonText, setAdjustReasonText] = useState("");

  // Product Add Modal State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdBrand, setNewProdBrand] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("cat-mobiles");
  const [newProdMrp, setNewProdMrp] = useState(1999);
  const [newProdPrice, setNewProdPrice] = useState(1499);
  const [newProdStock, setNewProdStock] = useState(15);
  const [newProdImages, setNewProdImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
  ]);
  const [newProdDesc, setNewProdDesc] = useState("");

  // Product Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdSku, setEditProdSku] = useState("");
  const [editProdBrand, setEditProdBrand] = useState("");
  const [editProdCategory, setEditProdCategory] = useState("");
  const [editProdMrp, setEditProdMrp] = useState(0);
  const [editProdPrice, setEditProdPrice] = useState(0);
  const [editProdStock, setEditProdStock] = useState(0);
  const [editProdImages, setEditProdImages] = useState<string[]>([]);
  const [editProdDesc, setEditProdDesc] = useState("");
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  // Product Delete Warning & 60-Second Undo State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deletedProductForUndo, setDeletedProductForUndo] = useState<Product | null>(null);
  const [undoCountdown, setUndoCountdown] = useState<number>(0);

  // Admin User CRUD State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserMobile, setNewUserMobile] = useState("");
  const [newUserPasswordInput, setNewUserPasswordInput] = useState("");
  const [newUserRole, setNewUserRole] = useState<"customer" | "admin">("customer");
  const [newUserStatus, setNewUserStatus] = useState<"active" | "suspended">("active");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserFullName, setEditUserFullName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserMobile, setEditUserMobile] = useState("");
  const [editUserRole, setEditUserRole] = useState<"customer" | "admin">("customer");
  const [editUserStatus, setEditUserStatus] = useState<"active" | "suspended">("active");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // External 2FA State
  const [test2faInput, setTest2faInput] = useState("");
  const [test2faStatus, setTest2faStatus] = useState<string | null>(null);
  const [isTesting2fa, setIsTesting2fa] = useState(false);
  const [replacementTotpSetup, setReplacementTotpSetup] = useState<{ secret: string; qrCodeDataUrl: string; expiresAt: string } | null>(null);
  const [replacementTotpCode, setReplacementTotpCode] = useState("");
  const [isReplacingAuthenticator, setIsReplacingAuthenticator] = useState(false);
  const [newDeviceTotpCode, setNewDeviceTotpCode] = useState("");
  const [newDeviceEnrollment, setNewDeviceEnrollment] = useState<{ code: string; expiresAt: string } | null>(null);
  const [isCreatingDeviceEnrollment, setIsCreatingDeviceEnrollment] = useState(false);

  // Layout Drag & Drop State
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState<number | null>(null);

  // Category Add Modal State
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatImage, setNewCatImage] = useState(
    "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=600&q=80"
  );

  // Marquee Add Modal State
  const [showAddMarquee, setShowAddMarquee] = useState(false);
  const [newMarqText, setNewMarqText] = useState("");
  const [newMarqLink, setNewMarqLink] = useState("/");
  const [newMarqBg, setNewMarqBg] = useState("#0F172A");
  const [newMarqTextCol, setNewMarqTextCol] = useState("#FFFFFF");
  const [newMarqPos, setNewMarqPos] = useState<"header" | "hero_top" | "footer">("header");

  // Settings State
  const [tempSettings, setTempSettings] = useState(settings);

  // Load users and admin profile on mount if admin authenticated
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAdminUsers(userSearch);
      fetchAdminProfile();
    }
  }, [isAdminAuthenticated, userSearch, fetchAdminUsers, fetchAdminProfile]);

  useEffect(() => {
    if (activeTab === "payments" && fetchSettlements) {
      fetchSettlements().then((s) => setSettlementsList(s));
    }
  }, [activeTab, fetchSettlements]);

  const handleOpenRefundModal = (order: Order) => {
    setRefundModalOrder(order);
    setRefundAmountInput(order.refundAmount || order.totalAmount);
    setRefundReasonInput("Customer requested refund / cancellation");
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalOrder) return;
    setIsProcessingRefund(true);
    const result = await processRefund(
      refundModalOrder.id,
      refundAmountInput,
      refundReasonInput
    );
    setIsProcessingRefund(false);
    if (result.success) {
      setRefundModalOrder(null);
    }
  };

  useEffect(() => {
    if (adminProfile) {
      setEditAdminName(adminProfile.fullName);
      setEditAdminEmail(adminProfile.email);
      setEditAdminMobile(adminProfile.mobileNumber);
      setEditAdminEntity(adminProfile.businessEntity);
    }
  }, [adminProfile]);

  useEffect(() => {
    if (isAdminAuthenticated && activeTab === "profile") {
      void fetchAdminPasskeys();
    }
  }, [activeTab, fetchAdminPasskeys, isAdminAuthenticated]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) return;

    setIsLoggingIn(true);
    const result = await adminLogin(adminPassword, adminEmail);
    if (result.requiresTotpSetup) {
      const setup = await beginAdminTotpSetup();
      if (setup) {
        setLoginTotpSetup(setup);
        setAdminLoginStep("totp-setup");
      }
    } else if (result.requiresTotp) {
      setHasApprovedDevice(Boolean(result.hasApprovedDevice));
      setAdminLoginStep("totp");
    }
    setIsLoggingIn(false);
  };

  const handleLoginTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(loginTotpCode)) {
      toast.error("Enter the current 6-digit Google Authenticator code.");
      return;
    }
    setIsLoggingIn(true);
    const result = adminLoginStep === "totp-setup"
      ? await confirmAdminTotpSetup(loginTotpCode)
      : await verifyAdminLoginTotp(loginTotpCode);
    if (result.success && result.requiresPasskey) {
      setHasApprovedDevice(Boolean(result.requiresDeviceRegistration ? false : true));
      setDeviceEnrollmentApproved(false);
      setDeviceApprovalCode("");
      setAdminLoginStep("passkey");
      setLoginTotpCode("");
      setLoginTotpSetup(null);
    }
    setIsLoggingIn(false);
  };

  const handlePasskeyLogin = async (mode: "authenticate" | "register") => {
    setIsLoggingIn(true);
    const result = await completeAdminPasskey(mode, deviceName);
    setIsLoggingIn(false);
    if (!result.success) toast.error(result.error || "Device verification failed.");
  };

  const handleApproveNewDevice = async () => {
    if (!/^\d{8}$/.test(deviceApprovalCode)) {
      toast.error("Enter the eight-digit approval code from an approved device.");
      return;
    }
    setIsLoggingIn(true);
    const result = await approveAdminPasskeyEnrollment(deviceApprovalCode);
    setIsLoggingIn(false);
    if (result.success) {
      setDeviceEnrollmentApproved(true);
      setDeviceApprovalCode("");
      toast.success("This device is approved for enrollment. Register its passkey now.");
    } else {
      toast.error(result.error || "This device was not approved.");
    }
  };

  // Keep hooks above the unauthenticated screen return so their order is stable.
  useEffect(() => {
    if (undoCountdown <= 0) {
      setDeletedProductForUndo(null);
      return;
    }
    const timer = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          setDeletedProductForUndo(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [undoCountdown]);

  // If not authenticated, render the Secure Admin Login Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl">
          <div className="text-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-slate-900/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Owner Administration Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Restricted access. Enter verified store owner administrative credentials.
            </p>
          </div>

          {adminLoginStep === "password" && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Admin Email / Username</label>
                <input type="text" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Admin Password</label>
                <div className="relative">
                  <input type={showAdminPassword ? "text" : "password"} required placeholder="Enter admin password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white" />
                  <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600">
                    {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoggingIn} className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-amber-400 font-extrabold text-sm shadow-lg shadow-slate-900/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50">
                <Lock className="h-4 w-4" /><span>{isLoggingIn ? "Checking password..." : "Continue"}</span>
              </button>
            </form>
          )}

          {adminLoginStep === "totp-setup" && loginTotpSetup && (
            <form onSubmit={handleLoginTotp} className="space-y-4">
              <p className="text-sm font-bold text-slate-800">Set up Google Authenticator</p>
              <p className="text-xs text-slate-500">Scan this new QR code in Google Authenticator, then enter its current six-digit code. This QR expires in ten minutes and becomes invalid after confirmation.</p>
              <Image src={loginTotpSetup.qrCodeDataUrl} alt="Google Authenticator setup QR code" width={208} height={208} unoptimized className="mx-auto h-52 w-52 rounded-xl border border-slate-200" />
              <details className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600"><summary className="cursor-pointer font-bold">Cannot scan the QR code?</summary><p className="mt-2 font-mono break-all select-all">{loginTotpSetup.secret}</p></details>
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} required placeholder="6-digit authenticator code" value={loginTotpCode} onChange={(e) => setLoginTotpCode(e.target.value.replace(/\D/g, ""))} className="w-full p-3 rounded-xl border border-slate-200 text-center font-mono font-bold tracking-[0.35em]" />
              <button type="submit" disabled={isLoggingIn} className="w-full py-3 rounded-xl bg-slate-900 text-amber-400 font-extrabold text-sm disabled:opacity-50">{isLoggingIn ? "Verifying..." : "Verify authenticator"}</button>
            </form>
          )}

          {adminLoginStep === "totp" && (
            <form onSubmit={handleLoginTotp} className="space-y-4">
              <p className="text-sm font-bold text-slate-800">Google Authenticator verification</p>
              <p className="text-xs text-slate-500">Enter the current six-digit code from your registered authenticator app.</p>
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus required placeholder="6-digit authenticator code" value={loginTotpCode} onChange={(e) => setLoginTotpCode(e.target.value.replace(/\D/g, ""))} className="w-full p-3 rounded-xl border border-slate-200 text-center font-mono font-bold tracking-[0.35em]" />
              <button type="submit" disabled={isLoggingIn} className="w-full py-3 rounded-xl bg-slate-900 text-amber-400 font-extrabold text-sm disabled:opacity-50">{isLoggingIn ? "Verifying..." : "Continue to device check"}</button>
            </form>
          )}

          {adminLoginStep === "passkey" && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-800">Approved-device verification</p>
              <p className="text-xs text-slate-500">Use this device’s device-bound passkey or hardware security key. Password and authenticator codes alone cannot open the portal.</p>
              {hasApprovedDevice ? (
                <button type="button" onClick={() => handlePasskeyLogin("authenticate")} disabled={isLoggingIn} className="w-full py-3 rounded-xl bg-slate-900 text-amber-400 font-extrabold text-sm disabled:opacity-50">{isLoggingIn ? "Verifying device..." : "Verify approved device"}</button>
              ) : null}
              <div className="border-t border-slate-200 pt-4 space-y-2">
                {hasApprovedDevice && !deviceEnrollmentApproved ? (
                  <>
                    <label className="block text-xs font-bold text-slate-700">Approve this new device</label>
                    <p className="text-[11px] leading-relaxed text-slate-500">On an already-approved device, open Admin Profile &amp; 2FA, enter a current authenticator code, and create a temporary eight-digit approval code. Enter it here. It expires in ten minutes and works once.</p>
                    <input inputMode="numeric" maxLength={8} value={deviceApprovalCode} onChange={(e) => setDeviceApprovalCode(e.target.value.replace(/\D/g, ""))} className="w-full p-2.5 rounded-xl border border-slate-200 text-center font-mono font-bold tracking-widest text-sm" placeholder="8-digit approval code" />
                    <button type="button" onClick={handleApproveNewDevice} disabled={isLoggingIn} className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold text-sm disabled:opacity-50">Approve this device</button>
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-bold text-slate-700">{hasApprovedDevice ? "Register approved device" : "Approve your first device"}</label>
                    <input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} maxLength={80} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm" placeholder="Example: My iPhone" />
                    <button type="button" onClick={() => handlePasskeyLogin("register")} disabled={isLoggingIn} className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold text-sm disabled:opacity-50">Register device-bound passkey</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // KPI Calculations
  const verifiedOrders = orders.filter((o) => o.paymentStatus === "Verified");
  const pendingPayments = orders.filter((o) => o.paymentStatus === "Verification Pending");
  const verifiedRevenue = verifiedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const lowStockProducts = products.filter(
    (p) => p.stockQuantity - p.reservedQuantity <= p.lowStockThreshold
  );

  const handleVerify = async (orderId: string) => {
    await verifyPayment(orderId);
  };

  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectOrderId || !rejectReason.trim()) {
      toast.error("Please enter a mandatory rejection reason.");
      return;
    }
    await rejectPayment(rejectOrderId, rejectReason.trim());
    setRejectOrderId(null);
    setRejectReason("");
  };

  const handleDeliveryConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryOrderId) return;
    await updateDeliveryStatus(
      deliveryOrderId,
      newDeliveryStatus,
      deliveryReference.trim(),
      deliveryNotes.trim()
    );
    setDeliveryOrderId(null);
    setDeliveryReference("");
    setDeliveryNotes("");
  };

  const handleStockAdjustConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) return;
    await adjustStock(
      adjustProductId,
      adjustNewQty,
      adjustReasonText.trim() || "Manual owner adjustment"
    );
    setAdjustProductId(null);
    setAdjustReasonText("");
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSku) {
      toast.error("Please provide both Product Name and SKU.");
      return;
    }

    if (newProdImages.length < 2) {
      toast.error("Please add at least 2 images for the product (Maximum: 10 images).");
      return;
    }
    if (newProdImages.length > 10) {
      toast.error("A product cannot have more than 10 images.");
      return;
    }

    const catObj = categories.find((c) => c.id === newProdCategory);
    const success = await addProduct({
      productName: newProdName,
      slug: newProdName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      sku: newProdSku,
      brand: newProdBrand || "Satya Certified",
      categoryId: newProdCategory,
      categoryName: catObj?.name || "Electronics",
      description: newProdDesc || "High quality electronics with manufacturer warranty.",
      images: newProdImages,
      mrp: Number(newProdMrp),
      sellingPrice: Number(newProdPrice),
      stockQuantity: Number(newProdStock),
      reservedQuantity: 0,
      lowStockThreshold: 3,
      specifications: { "Condition": "Brand New", "Warranty": "1 Year Official" },
      warranty: "1 Year Official Manufacturer Warranty",
      variants: [],
      publicationStatus: "active",
      rating: 4.9,
      reviewCount: 1,
    });

    if (success) {
      setShowAddProduct(false);
      setNewProdName("");
      setNewProdSku("");
      setNewProdImages([
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
      ]);
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    await addCategory({
      name: newCatName,
      slug: newCatSlug || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: newCatDesc,
      image: newCatImage,
      displayOrder: categories.length + 1,
      status: "active",
    });

    setShowAddCategory(false);
    setNewCatName("");
    setNewCatSlug("");
    setNewCatDesc("");
  };

  const handleAddMarqueeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarqText.trim()) return;

    await addMarquee({
      text: newMarqText.trim(),
      link: newMarqLink,
      position: newMarqPos,
      backgroundColor: newMarqBg,
      textColor: newMarqTextCol,
      status: "active",
    });

    setShowAddMarquee(false);
    setNewMarqText("");
  };

  const handleUserPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword || !newUserPassword) return;

    await adminUpdateUserPassword(selectedUserForPassword.id, newUserPassword);
    setSelectedUserForPassword(null);
    setNewUserPassword("");
    fetchAdminUsers(userSearch);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= homepageSections.length) return;

    const updated = [...homepageSections];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    // re-index order
    updated.forEach((s, i) => (s.order = i + 1));
    updateHomepageSections(updated);
  };

  const toggleSectionEnabled = (id: string) => {
    const updated = homepageSections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    updateHomepageSections(updated);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditProdName(p.productName);
    setEditProdSku(p.sku);
    setEditProdBrand(p.brand);
    setEditProdCategory(p.categoryId);
    setEditProdMrp(p.mrp);
    setEditProdPrice(p.sellingPrice);
    setEditProdStock(p.stockQuantity);
    setEditProdImages(p.images || []);
    setEditProdDesc(p.description || "");
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProdName || !editProdSku) {
      toast.error("Product name and SKU are required.");
      return;
    }
    if (editProdImages.length < 2) {
      toast.error("Please add at least 2 images for the product (Maximum: 10 images).");
      return;
    }
    if (editProdImages.length > 10) {
      toast.error("A product cannot have more than 10 images.");
      return;
    }

    setIsUpdatingProduct(true);
    const catObj = categories.find((c) => c.id === editProdCategory);
    const success = await updateProduct(editingProduct.id, {
      productName: editProdName,
      sku: editProdSku,
      brand: editProdBrand,
      categoryId: editProdCategory,
      categoryName: catObj?.name || editingProduct.categoryName,
      mrp: Number(editProdMrp),
      sellingPrice: Number(editProdPrice),
      stockQuantity: Number(editProdStock),
      images: editProdImages,
      description: editProdDesc,
    });
    setIsUpdatingProduct(false);
    if (success) {
      setEditingProduct(null);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const target = productToDelete;
    const success = await deleteProduct(target.id);
    setProductToDelete(null);
    if (success) {
      setDeletedProductForUndo(target);
      setUndoCountdown(60);
      toast.info(`Product "${target.productName}" deleted. You have 60 seconds to undo.`);
    }
  };

  const handleUndoDelete = async () => {
    if (!deletedProductForUndo) return;
    const target = deletedProductForUndo;
    const success = await restoreProduct(target.id);
    if (success) {
      setDeletedProductForUndo(null);
      setUndoCountdown(0);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserFullName || !newUserEmail || !newUserMobile) {
      toast.error("Full Name, Email, and Mobile are required.");
      return;
    }
    const success = await adminCreateUser({
      fullName: newUserFullName,
      email: newUserEmail,
      mobileNumber: newUserMobile,
      password: newUserPasswordInput || "SatyaStores@123",
      role: newUserRole,
      accountStatus: newUserStatus,
    });
    if (success) {
      setShowAddUser(false);
      setNewUserFullName("");
      setNewUserEmail("");
      setNewUserMobile("");
      setNewUserPasswordInput("");
      setNewUserRole("customer");
      setNewUserStatus("active");
      fetchAdminUsers(userSearch);
    }
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserFullName(u.fullName);
    setEditUserEmail(u.email);
    setEditUserMobile(u.mobileNumber);
    setEditUserRole(u.role === "admin" ? "admin" : "customer");
    setEditUserStatus(u.accountStatus);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const success = await adminUpdateUser(editingUser.id, {
      fullName: editUserFullName,
      email: editUserEmail,
      mobileNumber: editUserMobile,
      role: editUserRole,
      accountStatus: editUserStatus,
    });
    if (success) {
      setEditingUser(null);
      fetchAdminUsers(userSearch);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    const success = await adminDeleteUser(userToDelete.id);
    setUserToDelete(null);
    if (success) {
      fetchAdminUsers(userSearch);
    }
  };

  const handleTest2faCode = async () => {
    if (!test2faInput || test2faInput.length !== 6) {
      toast.error("Please enter a 6-digit verification code to test.");
      return;
    }
    setIsTesting2fa(true);
    const res = await verifyAdmin2faCode(test2faInput);
    setIsTesting2fa(false);
    if (res.valid) {
      setTest2faStatus(`Verified successfully via ${res.method}!`);
      toast.success(`2FA Code Verified: ${res.method}`);
    } else {
      setTest2faStatus(null);
      toast.error(res.error || "Invalid 2FA code.");
    }
  };

  const handleStartAuthenticatorReplacement = async () => {
    setIsReplacingAuthenticator(true);
    const setup = await beginAdminAuthenticatorReplacement();
    setIsReplacingAuthenticator(false);
    if (setup) {
      setReplacementTotpSetup(setup);
      setReplacementTotpCode("");
    }
  };

  const handleConfirmAuthenticatorReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(replacementTotpCode)) {
      toast.error("Enter the current 6-digit code from the newly scanned QR code.");
      return;
    }
    setIsReplacingAuthenticator(true);
    const result = await confirmAdminAuthenticatorReplacement(replacementTotpCode);
    setIsReplacingAuthenticator(false);
    if (result.success) {
      setReplacementTotpSetup(null);
      setReplacementTotpCode("");
      toast.success("Authenticator replaced. The old QR code is no longer valid.");
    }
  };

  const handleCreateDeviceEnrollment = async () => {
    if (!/^\d{6}$/.test(newDeviceTotpCode)) {
      toast.error("Enter the current six-digit Google Authenticator code.");
      return;
    }
    setIsCreatingDeviceEnrollment(true);
    const result = await createAdminPasskeyEnrollmentCode(newDeviceTotpCode);
    setIsCreatingDeviceEnrollment(false);
    if (result.success && result.code && result.expiresAt) {
      setNewDeviceEnrollment({ code: result.code, expiresAt: result.expiresAt });
      setNewDeviceTotpCode("");
      toast.success("Temporary device approval code created.");
    } else {
      toast.error(result.error || "Could not create a device approval code.");
    }
  };

  // Drag & drop handlers for homepage containers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectionIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverSectionIndex !== index) {
      setDragOverSectionIndex(index);
    }
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedSectionIndex === null || draggedSectionIndex === dropIndex) {
      setDraggedSectionIndex(null);
      setDragOverSectionIndex(null);
      return;
    }

    const updated = [...homepageSections];
    const itemToMove = updated.splice(draggedSectionIndex, 1)[0];
    updated.splice(dropIndex, 0, itemToMove);

    updated.forEach((s, i) => (s.order = i + 1));
    updateHomepageSections(updated);

    setDraggedSectionIndex(null);
    setDragOverSectionIndex(null);
    toast.success(`Section order updated: "${itemToMove.title}" moved to position #${dropIndex + 1}`);
  };

  const handleResetLayoutToDefault = () => {
    const defaultSections: HomepageSection[] = [
      { id: "sec-hero", type: "hero_banner", title: "Hero Carousel Banners", enabled: true, order: 1 },
      { id: "sec-categories", type: "categories", title: "Shop by Category Grid", enabled: true, order: 2 },
      { id: "sec-best-sellers", type: "best_sellers", title: "Best Selling Electronics", enabled: true, order: 3 },
      { id: "sec-featured", type: "featured_deals", title: "All Electronics Catalog & Grid", enabled: true, order: 4 },
      { id: "sec-trust", type: "trust_badges", title: "Direct UPI & Trust Banner", enabled: true, order: 5 },
    ];
    updateHomepageSections(defaultSections);
    toast.success("Homepage layout restored to default 5 containers!");
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-24 space-y-6">
      {/* Admin Command Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setActiveTab("overview")}
              className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
              title="Return to Admin Home"
            >
              <ShieldCheck className="h-6 w-6" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1
                  onClick={() => setActiveTab("overview")}
                  className="text-xl sm:text-2xl font-black tracking-tight cursor-pointer hover:text-amber-400 transition-colors"
                >
                  Satya Stores — Owner Command Center
                </h1>
                {activeTab !== "overview" && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400/20 text-amber-300 capitalize">
                    {activeTab}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Vasavi Enterprises • Complete store oversight, payments ledger, catalog, users & promotions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Module Switcher Dropdown */}
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
            >
              <option value="overview">🏠 Admin Home / Overview</option>
              <option value="products">📦 Products Catalog ({products.length})</option>
              <option value="orders">🛍️ Orders ({orders.length})</option>
              <option value="payments">💳 Payments ({pendingPayments.length})</option>
              <option value="users">👥 Users ({adminUsers.length || 3})</option>
              <option value="categories">🗂️ Categories ({categories.length})</option>
              <option value="layout">📱 Home Layout Builder</option>
              <option value="marquees">📢 Marquees ({marquees.length})</option>
              <option value="inventory">⚠️ Inventory ({lowStockProducts.length} low)</option>
              <option value="settings">⚙️ Store Settings</option>
              <option value="profile">🛡️ Admin Profile & 2FA</option>
            </select>
          </div>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Storefront</span>
          </Link>

          <button
            onClick={() => refreshBackendData()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Sync with Backend"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={adminLogout}
            className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold transition-all border border-rose-500/30"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Universal Breadcrumb & Return Bar for All Sub-Pages */}
      {activeTab !== "overview" && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setActiveTab("overview")}
              className="inline-flex items-center space-x-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-black text-amber-400 font-extrabold text-xs shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>← Back to Admin Home</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 capitalize">
              <span>{activeTab.replace("-", " ")} Management</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">Jump to module:</span>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
              className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="overview">🏠 Admin Home / Overview</option>
              <option value="products">📦 Products Catalog</option>
              <option value="orders">🛍️ Orders Management</option>
              <option value="payments">💳 Payments & Settlements</option>
              <option value="users">👥 User Management</option>
              <option value="categories">🗂️ Categories</option>
              <option value="layout">📱 Home Layout Builder</option>
              <option value="marquees">📢 Marquees & Announcements</option>
              <option value="inventory">⚠️ Inventory Movements</option>
              <option value="settings">⚙️ Store Settings</option>
              <option value="profile">🛡️ Admin Profile & 2FA</option>
            </select>
          </div>
        </div>
      )}

      {/* Horizontal Scrollable Tabs Navigation for Mobile & Desktop */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm">
        {[
          { id: "overview", label: "🏠 Home", icon: Home },
          { id: "profile", label: "Admin Profile & 2FA", icon: ShieldCheck },
          { id: "users", label: `Users (${adminUsers.length || 3})`, icon: Users },
          { id: "payments", label: `Payments (${pendingPayments.length})`, icon: CreditCard },
          { id: "orders", label: `Orders (${orders.length})`, icon: Package },
          { id: "products", label: `Products (${products.length})`, icon: Layers },
          { id: "categories", label: `Categories (${categories.length})`, icon: Layout },
          { id: "marquees", label: `Marquees (${marquees.length})`, icon: Volume2 },
          { id: "layout", label: "Home Layout", icon: Smartphone },
          { id: "inventory", label: "Inventory", icon: AlertTriangle },
          { id: "settings", label: "Store Settings", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & KPIS */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white/90">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Verified Revenue
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                {formatINR(verifiedRevenue)}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-flex items-center">
                From {verifiedOrders.length} verified transactions
              </span>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white/90">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pending UTR Queue
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 mt-1 block">
                {pendingPayments.length}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Awaiting bank statement review</span>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white/90">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Orders
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                {orders.length}
              </span>
              <span className="text-[10px] text-blue-600 font-bold mt-1 block">Across all categories</span>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white/90">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Registered Users
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                {adminUsers.length || 3}
              </span>
              <span className="text-[10px] text-indigo-600 font-bold mt-1 block">Verified customer accounts</span>
            </div>
          </div>

          {/* Low Stock Warning Banner */}
          {lowStockProducts.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <span>
                  <strong>{lowStockProducts.length} items</strong> are at or below their low-stock threshold!
                </span>
              </div>
              <button
                onClick={() => setActiveTab("inventory")}
                className="py-1 px-3 rounded-lg bg-amber-600 text-white font-bold"
              >
                Inspect Inventory
              </button>
            </div>
          )}

          {/* Quick Access Admin Module Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Grid className="h-5 w-5 text-amber-500" />
                  Admin Console Modules
                </h3>
                <p className="text-xs text-slate-500">
                  Select any section below to jump straight to it without scrolling through tabs
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                10 Modules
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  id: "products",
                  title: "Products Catalog",
                  description: "Manage catalog, drag-and-drop photos (2-10 images), pricing, and undo deletions.",
                  icon: Layers,
                  count: `${products.length} Products`,
                  badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  iconBg: "bg-emerald-500 text-white",
                  accentBorder: "hover:border-emerald-500",
                },
                {
                  id: "orders",
                  title: "Orders & Fulfillment",
                  description: "Track shipment workflows, status stages (Ordered, Shipped, Delivered), and invoices.",
                  icon: Package,
                  count: `${orders.length} Orders`,
                  badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
                  iconBg: "bg-blue-600 text-white",
                  accentBorder: "hover:border-blue-500",
                },
                {
                  id: "payments",
                  title: "Payments & Verification",
                  description: "Review manual UPI UTR 12-digit transaction proofs, bank receipts & Razorpay logs.",
                  icon: CreditCard,
                  count: pendingPayments.length > 0 ? `${pendingPayments.length} Need Review` : "All Verified",
                  badgeBg: pendingPayments.length > 0 ? "bg-amber-100 text-amber-800 border-amber-300 font-black animate-pulse" : "bg-slate-100 text-slate-700 border-slate-200",
                  iconBg: "bg-amber-500 text-white",
                  accentBorder: "hover:border-amber-500",
                },
                {
                  id: "users",
                  title: "Customer & Admin Users",
                  description: "Manage registered user accounts, Supabase credentials, admin privileges & roles.",
                  icon: Users,
                  count: `${adminUsers.length || 3} Accounts`,
                  badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
                  iconBg: "bg-indigo-600 text-white",
                  accentBorder: "hover:border-indigo-500",
                },
                {
                  id: "categories",
                  title: "Categories & Tax Rates",
                  description: "Manage store categories, sub-categories, HSN codes, and GST rates for tax invoices.",
                  icon: Layout,
                  count: `${categories.length} Categories`,
                  badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
                  iconBg: "bg-purple-600 text-white",
                  accentBorder: "hover:border-purple-500",
                },
                {
                  id: "layout",
                  title: "Home Layout Builder",
                  description: "Reorderable storefront grid containers, hero sliders, flash sale cards & banners.",
                  icon: Smartphone,
                  count: `${homepageSections.length} Sections`,
                  badgeBg: "bg-violet-50 text-violet-700 border-violet-200",
                  iconBg: "bg-violet-600 text-white",
                  accentBorder: "hover:border-violet-500",
                },
                {
                  id: "marquees",
                  title: "Marquees & Announcements",
                  description: "Manage ticker announcement ribbons, sale offers, discount alerts & moving banners.",
                  icon: Volume2,
                  count: `${marquees.length} Ribbons`,
                  badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
                  iconBg: "bg-cyan-600 text-white",
                  accentBorder: "hover:border-cyan-500",
                },
                {
                  id: "inventory",
                  title: "Inventory & Stock Alerts",
                  description: "Live warehouse stock tracking, low-inventory triggers & batch inventory logs.",
                  icon: AlertTriangle,
                  count: lowStockProducts.length > 0 ? `${lowStockProducts.length} Low Stock` : "All Healthy",
                  badgeBg: lowStockProducts.length > 0 ? "bg-rose-100 text-rose-800 border-rose-300 font-bold" : "bg-emerald-50 text-emerald-700 border-emerald-200",
                  iconBg: lowStockProducts.length > 0 ? "bg-rose-500 text-white" : "bg-slate-700 text-white",
                  accentBorder: "hover:border-rose-500",
                },
                {
                  id: "settings",
                  title: "Store & Gateway Settings",
                  description: "Configure UPI IDs, merchant QR codes, Razorpay secrets, and delivery charges.",
                  icon: Settings,
                  count: "Store Config",
                  badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
                  iconBg: "bg-slate-800 text-white",
                  accentBorder: "hover:border-slate-800",
                },
                {
                  id: "profile",
                  title: "Admin Profile & 2FA",
                  description: "Supabase cloud database sync, 2FA Google Authenticator, and password security.",
                  icon: ShieldCheck,
                  count: "Security & Cloud",
                  badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
                  iconBg: "bg-teal-600 text-white",
                  accentBorder: "hover:border-teal-500",
                },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as typeof activeTab);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`group text-left p-4 sm:p-5 rounded-2xl bg-white/95 border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${item.accentBorder} flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`p-2.5 rounded-xl ${item.iconBg} shadow-sm group-hover:scale-110 transition-transform`}>
                          <ItemIcon className="h-5 w-5" />
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeBg}`}>
                          {item.count}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-amber-600 transition-colors">
                      <span>Open Module</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: ADMIN PROFILE & TWO-FACTOR AUTHENTICATION (2FA) */}
      {/* ========================================================= */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Supabase & Cloud Live Database Status Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                <Database className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-emerald-950">
                    Live Supabase Database Integration
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 text-[10px] font-black uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Online & Linked
                  </span>
                </div>
                <p className="text-xs text-emerald-800/90 mt-0.5">
                  Project URL: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[11px]">https://tpxgrzfkfdxwnwqbqvgy.supabase.co</code>
                </p>
                <p className="text-[11px] text-emerald-700/80 mt-0.5">
                  Universal PBKDF2 Password Hashing active for all administrators and customer accounts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  refreshBackendData();
                  fetchAdminProfile();
                  toast.success("Synchronized with backend database!");
                }}
                className="py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Sync Database
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Admin Profile Details */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-blue-100 text-blue-600">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Store Owner Profile</h3>
                    <p className="text-xs text-slate-500">Official administrative identity & contact</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-xs font-bold py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                >
                  <Edit className="h-3.5 w-3.5" />
                  {isEditingProfile ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              {isEditingProfile ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await updateAdminProfile({
                      fullName: editAdminName.trim(),
                      email: editAdminEmail.trim(),
                      mobileNumber: editAdminMobile.trim(),
                      businessEntity: editAdminEntity.trim(),
                    });
                    if (ok) setIsEditingProfile(false);
                  }}
                  className="space-y-3.5 pt-1"
                >
                  <ProfileImagePicker
                    image={adminProfile?.profileImage}
                    name={editAdminName}
                    onUpload={async (fileName, fileData) => {
                      const uploaded = await uploadImage(fileName, fileData);
                      if (!uploaded.success || !uploaded.url) return null;
                      const saved = await updateAdminProfile({ profileImage: uploaded.url });
                      return saved ? uploaded.url : null;
                    }}
                  />
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Owner Full Name</label>
                    <input
                      type="text"
                      required
                      value={editAdminName}
                      onChange={(e) => setEditAdminName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Business Entity</label>
                    <input
                      type="text"
                      required
                      value={editAdminEntity}
                      onChange={(e) => setEditAdminEntity(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email</label>
                      <input
                        type="email"
                        required
                        value={editAdminEmail}
                        onChange={(e) => setEditAdminEmail(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Mobile</label>
                      <input
                        type="text"
                        required
                        value={editAdminMobile}
                        onChange={(e) => setEditAdminMobile(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
                    >
                      Save Profile Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 pt-1">
                  {adminProfile?.profileImage && (
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <span className="relative h-14 w-14 overflow-hidden rounded-full bg-slate-200">
                        <Image src={adminProfile.profileImage} alt="Store owner profile photo" fill sizes="56px" unoptimized className="object-cover" />
                      </span>
                      <span className="text-xs font-semibold text-slate-600">Store owner profile photo</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Administrator Name</span>
                    <span className="text-xs font-bold text-slate-900">{adminProfile?.fullName || editAdminName}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Business Entity</span>
                    <span className="text-xs font-bold text-slate-900">{adminProfile?.businessEntity || editAdminEntity}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Admin Email</span>
                    <span className="text-xs font-mono font-bold text-slate-900">{adminProfile?.email || editAdminEmail}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Mobile Contact</span>
                    <span className="text-xs font-mono font-bold text-slate-900">{adminProfile?.mobileNumber || editAdminMobile}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Role & Privileges</span>
                    <span className="text-[11px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg">
                      Super Administrator (Owner)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Two-Factor Authentication (2FA) & Change Password */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">2FA Security & Password</h3>
                    <p className="text-xs text-slate-500">Modify password protected by Two-Factor Authentication</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  2FA Active
                </span>
              </div>

              {/* External 2FA Provider Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>External Two-Factor Authentication (2FA)</span>
                  </div>
                  <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    RFC 6238 TOTP
                  </span>
                </div>

                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Every admin login requires the current 6-digit code from Google Authenticator, Microsoft Authenticator, Authy, or Apple Passwords. A QR code is shown only while enrolling or replacing an authenticator; it is never displayed as a permanent secret in this dashboard.
                </p>

                {!replacementTotpSetup ? (
                  <button type="button" onClick={handleStartAuthenticatorReplacement} disabled={isReplacingAuthenticator} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-50">
                    {isReplacingAuthenticator ? "Generating QR code..." : "Replace authenticator and generate new QR"}
                  </button>
                ) : (
                  <form onSubmit={handleConfirmAuthenticatorReplacement} className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[11px] font-bold text-amber-950">Scan this fresh QR code before it expires. Your existing authenticator remains active until this new code is confirmed.</p>
                    <Image src={replacementTotpSetup.qrCodeDataUrl} alt="Replacement Google Authenticator QR code" width={176} height={176} unoptimized className="mx-auto h-44 w-44 rounded-lg bg-white p-1" />
                    <details className="text-[11px] text-amber-950"><summary className="cursor-pointer font-bold">Use the setup key instead</summary><p className="mt-1 break-all font-mono select-all">{replacementTotpSetup.secret}</p></details>
                    <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} required placeholder="New 6-digit code" value={replacementTotpCode} onChange={(e) => setReplacementTotpCode(e.target.value.replace(/\D/g, ""))} className="w-full rounded-lg border border-amber-300 bg-white p-2 text-center font-mono font-bold tracking-widest text-xs" />
                    <div className="flex gap-2">
                      <button type="submit" disabled={isReplacingAuthenticator} className="rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-amber-400 disabled:opacity-50">Confirm new authenticator</button>
                      <button type="button" onClick={() => { setReplacementTotpSetup(null); setReplacementTotpCode(""); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-bold text-slate-700">Cancel</button>
                    </div>
                  </form>
                )}

                {/* Test Verification Sync */}
                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Test 6-digit app code..."
                    value={test2faInput}
                    onChange={(e) => setTest2faInput(e.target.value)}
                    className="w-36 p-1.5 rounded-lg border border-slate-200 text-xs font-mono text-center"
                  />
                  <button
                    type="button"
                    onClick={handleTest2faCode}
                    disabled={isTesting2fa || test2faInput.length !== 6}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors disabled:opacity-40"
                  >
                    {isTesting2fa ? "Verifying..." : "Verify Sync"}
                  </button>
                  {test2faStatus && (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {test2faStatus}
                    </span>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-slate-800">Approved devices</p>
                    <button type="button" onClick={() => void fetchAdminPasskeys()} className="text-[11px] font-bold text-blue-700 hover:text-blue-900">Refresh</button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500">Each device needs its own device-bound passkey after the password and authenticator check. Remove a lost or old device immediately.</p>
                  {adminPasskeys.length === 0 ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] font-semibold text-amber-900">No approved device is listed yet. The next password and authenticator sign-in can register one.</p>
                  ) : (
                    <ul className="space-y-2">
                      {adminPasskeys.map((device) => (
                        <li key={device.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">{device.name}</p>
                            <p className="text-[10px] text-slate-500">Added {new Date(device.createdAt).toLocaleDateString()} {device.lastUsedAt ? `· Last used ${new Date(device.lastUsedAt).toLocaleDateString()}` : "· Not used since setup"}</p>
                          </div>
                          <button type="button" onClick={() => { if (window.confirm(`Remove ${device.name}? This device will no longer be able to sign in.`)) void revokeAdminPasskey(device.id); }} className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <p className="font-bold text-slate-800">Add another fixed device</p>
                  <p className="text-[11px] leading-relaxed text-slate-500">On the new phone or laptop, first enter the admin password and its Google Authenticator code. It will then ask for this temporary code before it can create a passkey. This stops someone with only your password and authenticator code from silently adding their own device.</p>
                  <div className="flex gap-2">
                    <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={newDeviceTotpCode} onChange={(e) => setNewDeviceTotpCode(e.target.value.replace(/\D/g, ""))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white p-2 text-center font-mono text-xs font-bold tracking-widest" placeholder="Current 6-digit code" />
                    <button type="button" onClick={handleCreateDeviceEnrollment} disabled={isCreatingDeviceEnrollment} className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-50">{isCreatingDeviceEnrollment ? "Creating..." : "Create approval code"}</button>
                  </div>
                  {newDeviceEnrollment && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Give this code only to your new device</p>
                      <p className="mt-1 font-mono text-xl font-black tracking-[0.3em] text-emerald-950">{newDeviceEnrollment.code}</p>
                      <p className="mt-1 text-[10px] text-emerald-800">Single use · expires {new Date(newDeviceEnrollment.expiresAt).toLocaleTimeString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form to change admin password */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!adminCurrentPass || !adminNewPass || !admin2faCode) {
                    toast.error("Please fill in current password, new password, and external 2FA code.");
                    return;
                  }
                  if (adminNewPass.length < 12) {
                    toast.error("New password must be at least 12 characters.");
                    return;
                  }
                  if (adminNewPass !== adminConfirmPass) {
                    toast.error("New password and confirmation do not match.");
                    return;
                  }

                  setIsUpdatingAdminPass(true);
                  const result = await adminChangePasswordWith2FA(
                    adminCurrentPass,
                    adminNewPass,
                    admin2faCode
                  );
                  setIsUpdatingAdminPass(false);

                  if (result.success) {
                    setAdminCurrentPass("");
                    setAdminNewPass("");
                    setAdminConfirmPass("");
                    setAdmin2faCode("");
                  }
                }}
                className="space-y-3 pt-1"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminCurrentPass ? "text" : "password"}
                      required
                      placeholder="Enter current password"
                      value={adminCurrentPass}
                      onChange={(e) => setAdminCurrentPass(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminCurrentPass(!showAdminCurrentPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showAdminCurrentPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Admin Password
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminNewPass ? "text" : "password"}
                        required
                        placeholder="Min 6 characters"
                        value={adminNewPass}
                        onChange={(e) => setAdminNewPass(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminNewPass(!showAdminNewPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showAdminNewPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminConfirmPass ? "text" : "password"}
                        required
                        placeholder="Repeat new password"
                        value={adminConfirmPass}
                        onChange={(e) => setAdminConfirmPass(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminConfirmPass(!showAdminConfirmPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showAdminConfirmPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2FA Verification Step */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Two-Factor (2FA) Security Code from Authenticator App
                  </label>

                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code from Google/Microsoft Authenticator"
                    value={admin2faCode}
                    onChange={(e) => setAdmin2faCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-center font-mono font-bold tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingAdminPass}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdatingAdminPass ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Verifying 2FA & Updating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Verify 2FA & Update Admin Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: REGISTERED USERS MANAGEMENT & CRUD */}
      {/* ========================================================= */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search user by name, email or phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs font-bold text-slate-500">
                Total: {adminUsers.length} Users
              </span>
              <button
                onClick={() => setShowAddUser(true)}
                className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm shadow-blue-500/20"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add New User</span>
              </button>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {adminUsers.map((u) => {
                const userOrdersCount = orders.filter((o) => o.userId === u.id || o.customerEmail === u.email).length;

                return (
                  <div
                    key={u.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center uppercase shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 text-sm">{u.fullName}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === "owner"
                              ? "bg-amber-100 text-amber-800"
                              : u.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}>
                            {u.role.toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.accountStatus === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                            }`}>
                            {u.accountStatus === "active" ? "Active" : "Suspended"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {u.email} • {u.mobileNumber}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Joined {new Date(u.createdAt).toLocaleDateString()} • {userOrdersCount} orders placed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1 transition-colors"
                        title="Edit User Info"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setSelectedUserForPassword(u)}
                        className="py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center space-x-1 transition-colors"
                        title="Change User Password"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                        <span>Password</span>
                      </button>

                      {u.role !== "owner" && (
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: RAZORPAY PAYMENTS, REFUNDS & SETTLEMENTS LEDGER */}
      {/* ========================================================= */}
      {activeTab === "payments" && (
        <div className="space-y-5">
          {/* Top Header & Gateway Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Razorpay Payments, Refunds & Settlements
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Gateway Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage online transactions, Razorpay instant refunds, and bank account payouts
              </p>
            </div>

            {/* Sub-tab Switcher */}
            <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold self-start sm:self-auto overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setPaymentsSubTab("razorpay")}
                className={`py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${paymentsSubTab === "razorpay"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Razorpay Payments
              </button>
              <button
                type="button"
                onClick={() => setPaymentsSubTab("settlements")}
                className={`py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${paymentsSubTab === "settlements"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Settlements & Payouts
              </button>
              <button
                type="button"
                onClick={() => setPaymentsSubTab("pending_utr")}
                className={`py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${paymentsSubTab === "pending_utr"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Manual UTR Desk ({pendingPayments.length})
              </button>
            </div>
          </div>

          {/* SUBTAB 1: RAZORPAY TRANSACTIONS & REFUNDS */}
          {paymentsSubTab === "razorpay" && (
            <div className="space-y-4">
              {/* Metrics cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white/90 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Total Volume
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    {formatINR(verifiedRevenue)}
                  </span>
                </div>
                <div className="p-3.5 bg-white/90 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Verified Orders
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-600">
                    {verifiedOrders.length}
                  </span>
                </div>
                <div className="p-3.5 bg-white/90 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Refunds Processed
                  </span>
                  <span className="text-base sm:text-lg font-black text-purple-600">
                    {
                      orders.filter(
                        (o) => o.paymentStatus === "Refunded" || o.paymentStatus === "Partially Refunded"
                      ).length
                    }
                  </span>
                </div>
                <div className="p-3.5 bg-white/90 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Bank Payout Acc
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    Axis Bank (*7890)
                  </span>
                </div>
              </div>

              {/* Transactions Table with Responsive Mobile Scroll */}
              <div className="bg-white/95 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                    Payment Gateway Transactions Ledger
                  </h3>
                  <span className="text-xs text-slate-500">
                    {orders.filter((o) => o.paymentStatus !== "Awaiting Payment").length} records
                  </span>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left divide-y divide-slate-100 text-xs min-w-[650px]">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Order #</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Payment Reference</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders
                        .filter((o) => o.paymentStatus !== "Awaiting Payment" || o.paymentReference)
                        .map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-mono font-bold text-blue-600">
                              {o.orderNumber}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">{o.customerName}</span>
                              <span className="text-[11px] text-slate-400">{o.customerMobile}</span>
                            </td>
                            <td className="p-3 font-black text-slate-900">
                              {formatINR(o.totalAmount)}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700">
                                {o.paymentMethod === "RAZORPAY" ? "Razorpay" : o.paymentMethod}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-700">
                              {o.razorpayPaymentId || o.paymentReference || "N/A"}
                            </td>
                            <td className="p-3">
                              {o.paymentStatus === "Verified" ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  Verified
                                </span>
                              ) : o.paymentStatus === "Refunded" ? (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                                  Refunded ({formatINR(o.refundAmount || o.totalAmount)})
                                </span>
                              ) : o.paymentStatus === "Partially Refunded" ? (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                                  Part-Refunded ({formatINR(o.refundAmount || 0)})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                  {o.paymentStatus}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {o.paymentStatus === "Verified" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRefundModal(o)}
                                  className="py-1 px-2.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold inline-flex items-center gap-1 transition-all active:scale-95"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  <span>Issue Refund</span>
                                </button>
                              )}
                              {(o.paymentStatus === "Refunded" || o.paymentStatus === "Partially Refunded") && (
                                <span className="text-[11px] font-mono text-purple-600 block">
                                  {o.refundId || "Processed"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: RAZORPAY SETTLEMENTS & PAYOUTS */}
          {paymentsSubTab === "settlements" && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-200 uppercase font-bold tracking-wider">
                    Store Payout Account
                  </span>
                  <h3 className="text-lg font-black">Axis Bank Current A/C (****7890)</h3>
                  <p className="text-xs text-blue-200">
                    Beneficiary Entity: Vasavi Enterprises • Direct automated settlements (T+1)
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                  Auto-Settlement Active
                </span>
              </div>

              <div className="bg-white/95 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                    Settlement Batches & Bank Transfers
                  </h3>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left divide-y divide-slate-100 text-xs min-w-[650px]">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Settlement ID</th>
                        <th className="p-3">Gross Amount</th>
                        <th className="p-3">Gateway Fee (2%)</th>
                        <th className="p-3">GST (18%)</th>
                        <th className="p-3">Net Credited</th>
                        <th className="p-3">Bank UTR</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {settlementsList.map((setl) => (
                        <tr key={setl.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-blue-600">{setl.id}</td>
                          <td className="p-3 font-semibold text-slate-800">
                            {formatINR(setl.amount)}
                          </td>
                          <td className="p-3 text-slate-500">{formatINR(setl.fees)}</td>
                          <td className="p-3 text-slate-500">{formatINR(setl.tax)}</td>
                          <td className="p-3 font-black text-emerald-700">
                            {formatINR(setl.netAmount)}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-600">
                            {setl.utr || "CMS" + Math.floor(100000000000 + Math.random() * 900000000000)}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {setl.status === "settled" ? "Settled to Bank" : setl.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: MANUAL UTR VERIFICATION DESK */}
          {paymentsSubTab === "pending_utr" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Manual Verification Queue ({pendingPayments.length} Pending)
                </h3>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="p-10 text-center bg-white/90 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  All customer manual payments have been verified! No pending UTR submissions.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingPayments.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <span className="font-mono text-xs font-bold text-blue-600">
                            {order.orderNumber}
                          </span>
                          <p className="text-xs font-bold text-slate-900">{order.customerName}</p>
                        </div>
                        <span className="text-base font-black text-slate-900">
                          {formatINR(order.totalAmount)}
                        </span>
                      </div>

                      <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/60 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Method:</span>
                          <span className="font-bold text-slate-800">{order.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Submitted UTR:</span>
                          <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                            {order.paymentReference || "N/A"}
                          </span>
                        </div>
                      </div>

                      {order.paymentEvidenceUrl && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 block mb-1">
                            Receipt Proof:
                          </span>
                          <a
                            href={order.paymentEvidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block"
                          >
                            <Image width={640} height={640} unoptimized
                              src={order.paymentEvidenceUrl}
                              alt="Payment Receipt"
                              className="h-16 w-24 object-cover rounded-lg border border-slate-200 hover:scale-105 transition-transform"
                            />
                          </a>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          onClick={() => handleVerify(order.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-sm"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Verify & Confirm</span>
                        </button>
                        <button
                          onClick={() => setRejectOrderId(order.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 flex items-center justify-center space-x-1"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject with Reason</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RAZORPAY REFUND MODAL DIALOG */}
          {refundModalOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-purple-600" />
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Process Razorpay Refund
                    </h3>
                  </div>
                  <button
                    onClick={() => setRefundModalOrder(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/80 text-xs text-purple-900 space-y-1">
                  <p>
                    <strong>Order:</strong> {refundModalOrder.orderNumber} ({refundModalOrder.customerName})
                  </p>
                  <p>
                    <strong>Original Paid:</strong> {formatINR(refundModalOrder.totalAmount)}
                  </p>
                  <p>
                    <strong>Razorpay Payment ID:</strong>{" "}
                    <code className="font-mono">{refundModalOrder.razorpayPaymentId || refundModalOrder.paymentReference}</code>
                  </p>
                </div>

                <form onSubmit={handleConfirmRefund} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Refund Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={refundModalOrder.totalAmount}
                      value={refundAmountInput}
                      onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Max refundable: {formatINR(refundModalOrder.totalAmount)}
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Reason for Refund *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={refundReasonInput}
                      onChange={(e) => setRefundReasonInput(e.target.value)}
                      placeholder="e.g. Customer cancelled order / Item returned"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isProcessingRefund}
                      className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {isProcessingRefund
                        ? "Initiating with Razorpay..."
                        : `Confirm Refund of ${formatINR(refundAmountInput)}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefundModalOrder(null)}
                      className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ORDERS & MANUAL DISPATCH */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="divide-y divide-slate-100 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm">
            {orders.map((o) => (
              <div key={o.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{o.orderNumber}</span>
                    <span className="text-xs font-bold text-slate-900">• {o.customerName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {o.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {o.itemsSnapshot.map((it) => `${it.productName} (x${it.quantity})`).join(", ")}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Delivery: <strong className="text-slate-700">{o.deliveryStatus}</strong>
                    {o.manualDeliveryReference && ` • Tracking: ${o.manualDeliveryReference}`}
                  </p>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-auto">
                  <button
                    onClick={() => {
                      setDeliveryOrderId(o.id);
                      setDeliveryReference(o.manualDeliveryReference || "");
                      setNewDeliveryStatus(o.deliveryStatus);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs flex items-center space-x-1"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    <span>Dispatch / Courier</span>
                  </button>
                  <Link
                    href={`/orders/${o.id}`}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    View Invoice
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PRODUCTS CATALOG MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Store Catalog ({products.length} Products)
            </h2>
            <button
              onClick={() => setShowAddProduct(true)}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white/90 rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <Image width={640} height={640} unoptimized
                      src={p.images[0]}
                      alt={p.productName}
                      className="h-12 w-12 rounded-lg object-contain bg-slate-50 border border-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{p.productName}</h4>
                      <p className="text-[11px] text-slate-500">{p.brand} • {p.categoryName}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="font-bold text-slate-900">{formatINR(p.sellingPrice)}</span>
                    <span className="text-[11px] text-slate-400">Stock: {p.stockQuantity}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 pt-2 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => handleOpenEditProduct(p)}
                    className="py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] flex items-center space-x-1 transition-colors"
                    title="Edit product details & images"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setAdjustProductId(p.id);
                      setAdjustNewQty(p.stockQuantity);
                    }}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => setProductToDelete(p)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: CATEGORIES MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Store Categories ({categories.length})
            </h2>
            <button
              onClick={() => setShowAddCategory(true)}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-white/90 rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Image width={640} height={640} unoptimized
                    src={c.image}
                    alt={c.name}
                    className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{c.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">/category/{c.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteCategory(c.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Delete category"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: MARQUEES & ANNOUNCEMENT TICKERS */}
      {/* ========================================================= */}
      {activeTab === "marquees" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Announcement Marquee Tickers</h2>
              <p className="text-xs text-slate-500">Live scrolling text strips shown on header or storefront</p>
            </div>
            <button
              onClick={() => setShowAddMarquee(true)}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Marquee Ticker</span>
            </button>
          </div>

          <div className="space-y-3">
            {marquees.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white/90 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                    style={{ backgroundColor: m.backgroundColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{m.text}</p>
                    <p className="text-[10px] text-slate-400">Position: {m.position} • Target: {m.link || "None"}</p>
                  </div>
                </div>

                <button
                  onClick={() => deleteMarquee(m.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: HOMEPAGE CONTAINER & BLOCK LAYOUT (WORDPRESS STYLE) */}
      {/* ========================================================= */}
      {activeTab === "layout" && (
        <div className="space-y-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Layout className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Homepage Container Blocks & Layout</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Drag and drop container blocks like WordPress Gutenberg editor to control section sequence and visibility on the storefront.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetLayoutToDefault}
                className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                title="Restore default 5 homepage blocks"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>Reset to Default</span>
              </button>
              <Link
                href="/"
                target="_blank"
                className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                <span>View Storefront</span>
              </Link>
            </div>
          </div>

          {homepageSections.length === 0 ? (
            <div className="bg-white/90 rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <Layout className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No containers currently configured</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your homepage layout is currently blank. Click below to instantly initialize the 5 standard storefront container blocks.
              </p>
              <button
                onClick={handleResetLayoutToDefault}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
              >
                Initialize Standard Layout
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {homepageSections.map((sec, idx) => {
                const isBeingDragged = draggedSectionIndex === idx;
                const isDragOver = dragOverSectionIndex === idx;

                return (
                  <div
                    key={sec.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={() => handleDrop(idx)}
                    className={`p-4 rounded-2xl bg-white/95 border transition-all select-none shadow-sm ${isBeingDragged
                        ? "opacity-40 border-blue-400 scale-[0.99] bg-blue-50/50"
                        : isDragOver
                          ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30"
                          : "border-slate-200/90 hover:border-slate-300 hover:shadow-md"
                      }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Left Block Header & Grip */}
                      <div className="flex items-center space-x-3">
                        <div
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-grab active:cursor-grabbing shrink-0"
                          title="Drag to reorder section"
                        >
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <span className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          #{sec.order}
                        </span>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-sm text-slate-900">{sec.title}</h4>
                            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold border border-slate-200/60">
                              {sec.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {sec.type === "hero_banner" && "Top sliding promotional banners carousel & headline offers"}
                            {sec.type === "categories" && "Horizontal interactive circular department & category strip"}
                            {sec.type === "best_sellers" && "Top-rated gadgets & highest velocity customer favorites"}
                            {sec.type === "featured_deals" && "Full searchable catalog grid with brand & in-stock filters"}
                            {sec.type === "trust_badges" && "Official store trust, zero-fee direct UPI & warranty assurance banner"}
                          </p>
                        </div>
                      </div>

                      {/* Right Block Controls */}
                      <div className="flex items-center space-x-2 self-end md:self-auto">
                        <button
                          onClick={() => toggleSectionEnabled(sec.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${sec.enabled
                              ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                              : "bg-slate-200 hover:bg-slate-300 text-slate-600"
                            }`}
                        >
                          {sec.enabled ? "Enabled" : "Hidden"}
                        </button>

                        <button
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, "up")}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                          title="Move Up"
                        >
                          <MoveUp className="h-4 w-4" />
                        </button>

                        <button
                          disabled={idx === homepageSections.length - 1}
                          onClick={() => moveSection(idx, "down")}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                          title="Move Down"
                        >
                          <MoveDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Block Miniature Wireframe Mockup */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center space-x-2 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Wireframe Preview:</span>
                      {sec.type === "hero_banner" && (
                        <div className="flex-1 flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/60 font-mono text-[10px]">
                          <span className="h-4 w-12 bg-blue-200 rounded"></span>
                          <span className="h-4 flex-1 bg-slate-200 rounded"></span>
                          <span className="h-4 w-8 bg-amber-200 rounded"></span>
                        </div>
                      )}
                      {sec.type === "categories" && (
                        <div className="flex-1 flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60 font-mono text-[10px]">
                          <span className="h-4 w-4 rounded-full bg-slate-300"></span>
                          <span className="h-4 w-4 rounded-full bg-slate-300"></span>
                          <span className="h-4 w-4 rounded-full bg-slate-300"></span>
                          <span className="h-4 w-4 rounded-full bg-slate-300"></span>
                          <span className="h-4 flex-1 bg-slate-200/60 rounded"></span>
                        </div>
                      )}
                      {sec.type === "best_sellers" && (
                        <div className="flex-1 flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/60 font-mono text-[10px]">
                          <span className="h-4 flex-1 bg-amber-100 border border-amber-300 rounded text-amber-800 text-center leading-4">★ Pick 1</span>
                          <span className="h-4 flex-1 bg-amber-100 border border-amber-300 rounded text-amber-800 text-center leading-4">★ Pick 2</span>
                          <span className="h-4 flex-1 bg-amber-100 border border-amber-300 rounded text-amber-800 text-center leading-4">★ Pick 3</span>
                        </div>
                      )}
                      {sec.type === "featured_deals" && (
                        <div className="flex-1 flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/60 font-mono text-[10px]">
                          <span className="h-4 w-16 bg-blue-600/20 rounded"></span>
                          <span className="h-4 flex-1 bg-slate-200 rounded"></span>
                          <span className="h-4 flex-1 bg-slate-200 rounded"></span>
                        </div>
                      )}
                      {sec.type === "trust_badges" && (
                        <div className="flex-1 flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/60 font-mono text-[10px]">
                          <span className="h-4 w-6 bg-blue-600 rounded"></span>
                          <span className="h-4 flex-1 bg-blue-50 border border-blue-200 rounded text-blue-700 text-center leading-4">Direct UPI & Razorpay Trust</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 9: INVENTORY CONSOLE */}
      {/* ========================================================= */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="bg-white/90 rounded-2xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Total Stock</th>
                  <th className="p-3">Reserved</th>
                  <th className="p-3">Free Stock</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const free = p.stockQuantity - p.reservedQuantity;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{p.productName}</td>
                      <td className="p-3 font-mono text-slate-500">{p.sku}</td>
                      <td className="p-3 font-bold">{p.stockQuantity}</td>
                      <td className="p-3 text-amber-600 font-bold">{p.reservedQuantity}</td>
                      <td className={`p-3 font-black ${free <= p.lowStockThreshold ? "text-rose-600" : "text-emerald-600"}`}>
                        {free} units
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setAdjustProductId(p.id);
                            setAdjustNewQty(p.stockQuantity);
                          }}
                          className="py-1 px-2.5 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 10: STORE & BANKING SETTINGS */}
      {/* ========================================================= */}
      {activeTab === "settings" && (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200 shadow-sm max-w-2xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Payment & Bank Credentials Configuration
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Store UPI ID</label>
              <input
                type="text"
                value={tempSettings.upiId}
                onChange={(e) => setTempSettings({ ...tempSettings, upiId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">UPI Recipient Name</label>
              <input
                type="text"
                value={tempSettings.upiRecipientName}
                onChange={(e) => setTempSettings({ ...tempSettings, upiRecipientName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={tempSettings.bankName}
                  onChange={(e) => setTempSettings({ ...tempSettings, bankName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={tempSettings.bankAccountNumber}
                  onChange={(e) => setTempSettings({ ...tempSettings, bankAccountNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  value={tempSettings.bankIFSC}
                  onChange={(e) => setTempSettings({ ...tempSettings, bankIFSC: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Support WhatsApp Phone</label>
                <input
                  type="text"
                  value={tempSettings.supportPhone}
                  onChange={(e) => setTempSettings({ ...tempSettings, supportPhone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <button
              onClick={() => updateSettings(tempSettings)}
              className="py-2.5 px-6 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
            >
              Save Store Settings
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* Change User Password Modal */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedUserForPassword(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Change Customer Password</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedUserForPassword.fullName} ({selectedUserForPassword.email})</p>

            <form onSubmit={handleUserPasswordChange} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewUserPassword ? "text" : "password"}
                    required
                    minLength={12}
                    placeholder="Enter new password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    className="absolute right-3 top-2.5 text-slate-400"
                  >
                    {showNewUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button type="submit" className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs">
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserForPassword(null)}
                  className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddProduct(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base mb-4">Add New Product to Catalog</h3>
            <form onSubmit={handleAddProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OnePlus 13 5G (16GB RAM, 512GB)"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="SAT-OP-13-512"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="OnePlus, Apple, Sony"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Key features, condition, and warranty details"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProdMrp}
                    onChange={(e) => setNewProdMrp(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Product Images (Drag & Drop or Mobile Upload)
                </label>
                <ProductImageUploader
                  images={newProdImages}
                  onChange={setNewProdImages}
                  minImages={2}
                  maxImages={10}
                />
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="submit"
                  disabled={newProdImages.length < 2 || newProdImages.length > 10}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${newProdImages.length < 2 || newProdImages.length > 10
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.99]"
                    }`}
                >
                  {newProdImages.length < 2
                    ? `Save Product (Min 2 Images: currently ${newProdImages.length})`
                    : newProdImages.length > 10
                      ? `Save Product (Max 10 Images: currently ${newProdImages.length})`
                      : "Save Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddCategory(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-3">Create New Category</h3>
            <form onSubmit={handleAddCategorySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Watches & Wearables"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">URL Slug</label>
                <input
                  type="text"
                  placeholder="smart-watches"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="text"
                  required
                  value={newCatImage}
                  onChange={(e) => setNewCatImage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold">
                  Create Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Marquee Modal */}
      {showAddMarquee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddMarquee(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-3">Add Scrolling Marquee Ticker</h3>
            <form onSubmit={handleAddMarqueeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Announcement Text</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. 🔥 DIWALI SUPER SALE: Up to 50% OFF on all QLED TVs!"
                  value={newMarqText}
                  onChange={(e) => setNewMarqText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Position</label>
                  <select
                    value={newMarqPos}
                    onChange={(e) => setNewMarqPos(e.target.value as "header" | "hero_top" | "footer")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="header">Top Header</option>
                    <option value="hero_top">Above Hero Banner</option>
                    <option value="footer">Above Footer</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Link</label>
                  <input
                    type="text"
                    value={newMarqLink}
                    onChange={(e) => setNewMarqLink(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="font-semibold text-slate-700 flex items-center justify-between gap-2">
                  Background
                  <input
                    type="color"
                    value={newMarqBg}
                    onChange={(e) => setNewMarqBg(e.target.value)}
                    className="h-9 w-12 rounded border border-slate-200"
                    aria-label="Announcement background color"
                  />
                </label>
                <label className="font-semibold text-slate-700 flex items-center justify-between gap-2">
                  Text color
                  <input
                    type="color"
                    value={newMarqTextCol}
                    onChange={(e) => setNewMarqTextCol(e.target.value)}
                    className="h-9 w-12 rounded border border-slate-200"
                    aria-label="Announcement text color"
                  />
                </label>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold">
                  Publish Marquee
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMarquee(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRejectOrderId(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">Reject Payment Submission</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter mandatory reason why this UTR was not verified in your bank records.
            </p>
            <form onSubmit={handleRejectConfirm} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="e.g. UTR reference not reflected in Axis bank statement; transferred amount does not match order total."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
              <div className="flex items-center space-x-2">
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs">
                  Confirm Rejection & Release Stock
                </button>
                <button
                  type="button"
                  onClick={() => setRejectOrderId(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Dispatch Modal */}
      {deliveryOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeliveryOrderId(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">Manual Delivery & Dispatch Coordination</h3>
            <p className="text-xs text-slate-500 mb-4">Attach local courier consignment reference or delivery agent contact.</p>
            <form onSubmit={handleDeliveryConfirm} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Delivery Status</label>
                <select
                  value={newDeliveryStatus}
                  onChange={(e) => setNewDeliveryStatus(e.target.value as DeliveryStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Preparing for Dispatch">Preparing for Dispatch</option>
                  <option value="Ready for Dispatch">Ready for Dispatch</option>
                  <option value="Dispatched">Dispatched (In Transit)</option>
                  <option value="Delivered">Delivered to Customer</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Courier Reference / Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. DTDC Express Tracking #7382910"
                  value={deliveryReference}
                  onChange={(e) => setDeliveryReference(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Internal Delivery Notes</label>
                <input
                  type="text"
                  placeholder="Handed over to Ramesh Driver for direct doorstep delivery"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold">
                  Update Delivery Milestone
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryOrderId(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAdjustProductId(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Adjust Physical Stock Quantity</h3>
            <form onSubmit={handleStockAdjustConfirm} className="space-y-3 text-xs mt-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Physical Quantity</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={adjustNewQty}
                  onChange={(e) => setAdjustNewQty(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Adjustment</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New warehouse shipment arrived from distributor"
                  value={adjustReasonText}
                  onChange={(e) => setAdjustReasonText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <button type="submit" className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold">
                  Update Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustProductId(null)}
                  className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingProduct(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Product Details</h3>
                <p className="text-xs text-slate-500 font-mono">{editingProduct.sku}</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={editProdSku}
                    onChange={(e) => setEditProdSku(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={editProdBrand}
                    onChange={(e) => setEditProdBrand(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Store Category</label>
                <select
                  value={editProdCategory}
                  onChange={(e) => setEditProdCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={editProdMrp}
                    onChange={(e) => setEditProdMrp(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editProdPrice}
                    onChange={(e) => setEditProdPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock Units</label>
                  <input
                    type="number"
                    required
                    value={editProdStock}
                    onChange={(e) => setEditProdStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Product Images (Min 2, Max 10 • Drag & Drop to Reorder)
                </label>
                <ProductImageUploader
                  images={editProdImages}
                  onChange={setEditProdImages}
                  minImages={2}
                  maxImages={10}
                />
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="submit"
                  disabled={isUpdatingProduct || editProdImages.length < 2 || editProdImages.length > 10}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${editProdImages.length < 2 || editProdImages.length > 10
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.99]"
                    }`}
                >
                  {isUpdatingProduct
                    ? "Saving Changes..."
                    : editProdImages.length < 2
                      ? `Save Changes (Min 2 Images: currently ${editProdImages.length})`
                      : editProdImages.length > 10
                        ? `Save Changes (Max 10 Images: currently ${editProdImages.length})`
                        : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Deletion Warning Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setProductToDelete(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Confirm Product Deletion</h3>
                <p className="text-xs text-slate-500">This item will be removed from customer view</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center space-x-3">
              {productToDelete.images?.[0] && (
                <Image width={640} height={640} unoptimized
                  src={productToDelete.images[0]}
                  alt={productToDelete.productName}
                  className="h-12 w-12 rounded-lg object-contain bg-white border border-slate-100"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 truncate">{productToDelete.productName}</h4>
                <p className="text-slate-500 text-[11px] font-mono">{productToDelete.sku} • {formatINR(productToDelete.sellingPrice)}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong>Undo Available:</strong> After deleting, a floating banner will appear allowing you to <strong>undo and restore</strong> this product for <strong>60 seconds</strong>.
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all"
              >
                Yes, Delete Product
              </button>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
              >
                Keep Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating 60-Second Undo Banner */}
      {deletedProductForUndo && undoCountdown > 0 && (
        <aside aria-label="Undo action" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">
                  Product &ldquo;{deletedProductForUndo.productName}&rdquo; deleted
                </p>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{undoCountdown}s remaining to undo</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleUndoDelete}
                className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20 transition-colors"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Undo Delete</span>
              </button>
              <button
                onClick={() => {
                  setDeletedProductForUndo(null);
                  setUndoCountdown(0);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Add New User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddUser(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Create New Store User</h3>
              <button onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="customer@domain.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={newUserMobile}
                  onChange={(e) => setNewUserMobile(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Password (Default: SatyaStores@123)</label>
                <input
                  type="password"
                  placeholder="Leave empty for default SatyaStores@123"
                  value={newUserPasswordInput}
                  onChange={(e) => setNewUserPasswordInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">User Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as "customer" | "admin")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin Manager</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Account Status</label>
                  <select
                    value={newUserStatus}
                    onChange={(e) => setNewUserStatus(e.target.value as "active" | "suspended")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">
                  Create User Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Edit User Details</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserFullName}
                  onChange={(e) => setEditUserFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Number</label>
                <input
                  type="text"
                  required
                  value={editUserMobile}
                  onChange={(e) => setEditUserMobile(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Role</label>
                  <select
                    disabled={editingUser.role === "owner"}
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as "customer" | "admin")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-50"
                  >
                    {editingUser.role === "owner" ? (
                      <option value="owner">Store Owner</option>
                    ) : (
                      <>
                        <option value="customer">Customer</option>
                        <option value="admin">Admin Manager</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Account Status</label>
                  <select
                    disabled={editingUser.role === "owner"}
                    value={editUserStatus}
                    onChange={(e) => setEditUserStatus(e.target.value as "active" | "suspended")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">
                  Save User Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setUserToDelete(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete User Account</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete user <strong>{userToDelete.fullName}</strong> ({userToDelete.email})?
            </p>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all"
              >
                Yes, Delete User
              </button>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
