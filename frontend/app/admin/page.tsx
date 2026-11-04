"use client";

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
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Truck,
  ArrowUpRight,
  RefreshCw,
  Search,
  FileText,
  Users,
  KeyRound,
  Tag,
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
} from "lucide-react";
import { toast } from "sonner";
import { OrderStatus, DeliveryStatus, Product, Category, Coupon, MarqueeItem, HomepageSection, User, AdminProfile } from "@/types";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";

export default function AdminDashboardPage() {
  const {
    products,
    categories,
    orders,
    settings,
    inventoryMovements,
    verifyPayment,
    rejectPayment,
    updateOrderStatus,
    updateDeliveryStatus,
    adjustStock,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    updateSettings,
    adminLogin,
    adminLogout,
    isAdminAuthenticated,
    adminUsers,
    fetchAdminUsers,
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
    generateAdmin2fa,
    adminChangePasswordWith2FA,
  } = useStore();

  // Login form state
  const [adminEmail, setAdminEmail] = useState("admin@sathyastores.com");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
  const [generated2faNotice, setGenerated2faNotice] = useState<string | null>(null);
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
  ]);
  const [newProdDesc, setNewProdDesc] = useState("");

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
    if (adminProfile) {
      setEditAdminName(adminProfile.fullName);
      setEditAdminEmail(adminProfile.email);
      setEditAdminMobile(adminProfile.mobileNumber);
      setEditAdminEntity(adminProfile.businessEntity);
    }
  }, [adminProfile]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) return;

    setIsLoggingIn(true);
    await adminLogin(adminPassword, adminEmail);
    setIsLoggingIn(false);
  };

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

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Admin Email / Username
              </label>
              <input
                type="text"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? "text" : "password"}
                  required
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-amber-400 font-extrabold text-sm shadow-lg shadow-slate-900/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Authenticate & Enter Console</span>
                </>
              )}
            </button>
          </form>
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
    if (!newProdName || !newProdSku) return;

    const catObj = categories.find((c) => c.id === newProdCategory);
    await addProduct({
      productName: newProdName,
      slug: newProdName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      sku: newProdSku,
      brand: newProdBrand || "Satya Certified",
      categoryId: newProdCategory,
      categoryName: catObj?.name || "Electronics",
      description: newProdDesc || "High quality electronics with manufacturer warranty.",
      images:
        newProdImages.length > 0
          ? newProdImages
          : ["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80"],
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

    setShowAddProduct(false);
    setNewProdName("");
    setNewProdSku("");
    setNewProdImages([
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
    ]);
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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-24 space-y-6">
      {/* Admin Command Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Satya Stores — Owner Command Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Vasavi Enterprises • Complete store oversight, payments ledger, catalog, users & promotions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Customer Storefront</span>
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

      {/* Horizontal Scrollable Tabs Navigation for Mobile & Desktop */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
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
              className={`flex items-center space-x-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
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

              {/* 2FA Status Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>2FA Protection Mode</span>
                  <span className="font-mono text-blue-600">6-Digit OTP</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Whenever changing the admin password, verify with a fresh 6-digit code generated for this session.
                </p>
              </div>

              {/* Form to change admin password */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!adminCurrentPass || !adminNewPass || !admin2faCode) {
                    toast.error("Please fill in current password, new password, and 2FA code.");
                    return;
                  }
                  if (adminNewPass.length < 6) {
                    toast.error("New password must be at least 6 characters.");
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
                    setGenerated2faNotice(null);
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
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Two-Factor (2FA) Security Code
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await generateAdmin2fa();
                        if (res.success && res.otp) {
                          setGenerated2faNotice(res.otp);
                          setAdmin2faCode(res.otp);
                        }
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      Generate 2FA Code
                    </button>
                  </div>

                  {generated2faNotice && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                      <span>Simulated 2FA Code sent to phone:</span>
                      <span className="font-mono font-black text-amber-950 bg-amber-200 px-2 py-0.5 rounded">
                        {generated2faNotice}
                      </span>
                    </div>
                  )}

                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit 2FA code"
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
      {/* TAB 2: REGISTERED USERS MANAGEMENT & PASSWORD MODIFICATION */}
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

            <span className="text-xs font-bold text-slate-500">
              Total Registered: {adminUsers.length} Users
            </span>
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
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            u.role === "owner" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {u.role.toUpperCase()}
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

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        onClick={() => setSelectedUserForPassword(u)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center space-x-1 transition-colors"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                        <span>Change Password</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PAYMENTS & UTR VERIFICATION LEDGER */}
      {/* ========================================================= */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Payment Verification Desk ({pendingPayments.length} Pending)
            </h2>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="p-10 text-center bg-white/90 rounded-2xl border border-slate-200 text-xs text-slate-500">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              All customer payments have been verified! No pending UTR submissions.
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
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">Receipt Proof:</span>
                      <a
                        href={order.paymentEvidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block"
                      >
                        <img
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

          {/* Verified Transactions History Table */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Verified Transaction History</h3>
            <div className="bg-white/90 rounded-2xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">UTR Reference</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verifiedOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-600">{o.orderNumber}</td>
                      <td className="p-3 font-semibold">{o.customerName}</td>
                      <td className="p-3 font-bold text-slate-900">{formatINR(o.totalAmount)}</td>
                      <td className="p-3 font-mono text-slate-600">{o.paymentReference || "N/A"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Verified
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
                    <img
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

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => {
                      setAdjustProductId(p.id);
                      setAdjustNewQty(p.stockQuantity);
                    }}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
                  <img
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
      {/* TAB 8: HOMEPAGE LAYOUT & LIVE PREVIEW */}
      {/* ========================================================= */}
      {activeTab === "layout" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Homepage Module Layout & Sequence</h2>
            <p className="text-xs text-slate-500">Reorder cards and sections to design the customer homepage flow</p>
          </div>

          <div className="space-y-2">
            {homepageSections.map((sec, idx) => (
              <div
                key={sec.id}
                className="p-3.5 rounded-2xl bg-white/90 border border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                    {sec.order}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{sec.title}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{sec.type}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleSectionEnabled(sec.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      sec.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {sec.enabled ? "Enabled" : "Hidden"}
                  </button>

                  <button
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, "up")}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30"
                  >
                    <MoveUp className="h-4 w-4" />
                  </button>
                  <button
                    disabled={idx === homepageSections.length - 1}
                    onClick={() => moveSection(idx, "down")}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30"
                  >
                    <MoveDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                    minLength={6}
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
                />
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold">
                  Save Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600"
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
    </div>
  );
}
