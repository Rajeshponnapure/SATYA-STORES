"use client";

import React, { useState } from "react";
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
  Plus,
  Edit,
  Truck,
  ArrowUpRight,
  RefreshCw,
  Search,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { OrderStatus, DeliveryStatus, Product } from "@/types";

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
    updateSettings,
    currentUser,
    loginAsOwner,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "products" | "inventory" | "orders" | "settings"
  >("overview");

  // Rejection Modal State
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Manual Delivery Modal State
  const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null);
  const [deliveryReference, setDeliveryReference] = useState("");
  const [newDeliveryStatus, setNewDeliveryStatus] = useState<DeliveryStatus>("Dispatched");

  // Stock Adjustment Modal State
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [adjustNewQty, setAdjustNewQty] = useState<number>(0);
  const [adjustReasonText, setAdjustReasonText] = useState("");

  // Settings State
  const [tempSettings, setTempSettings] = useState(settings);

  // New Product Modal State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdBrand, setNewProdBrand] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("cat-mobiles");
  const [newProdMrp, setNewProdMrp] = useState(1999);
  const [newProdPrice, setNewProdPrice] = useState(1499);
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdImage, setNewProdImage] = useState(
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80"
  );
  const [newProdDesc, setNewProdDesc] = useState("");

  // KPI Calculations
  const verifiedOrders = orders.filter((o) => o.paymentStatus === "Verified");
  const pendingPayments = orders.filter((o) => o.paymentStatus === "Verification Pending");
  const verifiedRevenue = verifiedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const lowStockProducts = products.filter(
    (p) => p.stockQuantity - p.reservedQuantity <= p.lowStockThreshold
  );

  const handleVerify = (orderId: string) => {
    verifyPayment(orderId);
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectOrderId || !rejectReason.trim()) {
      toast.error("Please enter a mandatory rejection reason.");
      return;
    }
    rejectPayment(rejectOrderId, rejectReason.trim());
    setRejectOrderId(null);
    setRejectReason("");
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryOrderId) return;
    updateDeliveryStatus(deliveryOrderId, newDeliveryStatus, deliveryReference);
    setDeliveryOrderId(null);
    setDeliveryReference("");
  };

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) return;
    adjustStock(adjustProductId, adjustNewQty, adjustReasonText || "Manual stock count adjustment");
    setAdjustProductId(null);
    setAdjustReasonText("");
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(tempSettings);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === newProdCategory);
    addProduct({
      productName: newProdName,
      slug: newProdName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      sku: newProdSku || `SAT-${Date.now().toString().slice(-4)}`,
      brand: newProdBrand || "Satya",
      categoryId: newProdCategory,
      categoryName: cat?.name || "General",
      description: newProdDesc || "High quality electronics guaranteed by Vasavi Enterprises.",
      images: [newProdImage],
      mrp: Number(newProdMrp),
      sellingPrice: Number(newProdPrice),
      stockQuantity: Number(newProdStock),
      reservedQuantity: 0,
      lowStockThreshold: 3,
      specifications: { Warranty: "1 Year Official Warranty" },
      warranty: "1 Year Official Warranty",
      variants: [],
      publicationStatus: "active",
      rating: 5.0,
      reviewCount: 1,
    });
    setShowAddProduct(false);
    setNewProdName("");
    setNewProdSku("");
    setNewProdBrand("");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Store Owner Info */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Single-Owner Administration Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Satya Stores Command Center
          </h1>
          <p className="text-xs text-slate-500">
            Managed entity: <strong>Vasavi Enterprises</strong> • Autonomous store operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 font-bold text-xs shadow-sm transition-colors"
          >
            ← View Customer Storefront
          </Link>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Store Active
          </span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center bg-slate-200/70 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "overview"
              ? "bg-white text-slate-900 shadow-sm font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Overview & Metrics
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "payments"
              ? "bg-white text-blue-600 shadow-sm font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CreditCard className="h-4 w-4" /> Payment Verification
          {pendingPayments.length > 0 && (
            <span className="h-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
              {pendingPayments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "products"
              ? "bg-white text-slate-900 shadow-sm font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Package className="h-4 w-4" /> Product Catalog ({products.length})
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "inventory"
              ? "bg-white text-slate-900 shadow-sm font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="h-4 w-4" /> Hybrid Inventory
          {lowStockProducts.length > 0 && (
            <span className="h-5 px-1.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {lowStockProducts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "orders"
              ? "bg-white text-slate-900 shadow-sm font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Truck className="h-4 w-4" /> Orders & Deliveries ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "settings"
              ? "bg-white text-slate-900 shadow-sm font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Settings className="h-4 w-4" /> Store & UPI Settings
        </button>
      </div>

      {/* TAB 1: OVERVIEW & METRICS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Verified Net Revenue
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatINR(verifiedRevenue)}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                Based on confirmed bank settlement
              </span>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Awaiting Verification
              </span>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {pendingPayments.length} Payments
              </div>
              <button
                onClick={() => setActiveTab("payments")}
                className="text-[10px] text-blue-600 font-bold hover:underline block mt-1"
              >
                Go to Verification Queue →
              </button>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Orders Received
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {orders.length}
              </div>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                {verifiedOrders.length} confirmed / {orders.length - verifiedOrders.length} processing
              </span>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Low Stock Warnings
              </span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {lowStockProducts.length} Items
              </div>
              <button
                onClick={() => setActiveTab("inventory")}
                className="text-[10px] text-amber-700 font-bold hover:underline block mt-1"
              >
                Inspect Stock Levels →
              </button>
            </div>
          </div>

          {/* Quick Action Payment Queue on Overview */}
          {pendingPayments.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border border-blue-200 bg-blue-50/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    High Priority: {pendingPayments.length} Payment(s) Awaiting Owner Decision
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab("payments")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-slate-200/80">
                {pendingPayments.map((ord) => (
                  <div
                    key={ord.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{ord.orderNumber}</span>
                        <span className="font-mono text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          UTR: {ord.paymentReference}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Customer: {ord.customerName} ({ord.customerMobile}) • Amount:{" "}
                        <strong className="text-slate-900">{formatINR(ord.totalAmount)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerify(ord.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verify Payment
                      </button>
                      <button
                        onClick={() => setRejectOrderId(ord.id)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYMENT VERIFICATION QUEUE */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Manual Bank / UPI Payment Verification Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Verify incoming customer UTR references against your business account.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Method & UTR</th>
                    <th className="px-4 py-3">Expected Amount</th>
                    <th className="px-4 py-3">Evidence</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{ord.customerName}</div>
                        <div className="text-[11px] text-slate-400">{ord.customerMobile}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-700 block">{ord.paymentMethod}</span>
                        <code className="text-[11px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          {ord.paymentReference || "Not Submitted"}
                        </code>
                      </td>
                      <td className="px-4 py-3.5 font-black text-slate-900">
                        {formatINR(ord.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5">
                        {ord.paymentEvidenceUrl ? (
                          <a
                            href={ord.paymentEvidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                          >
                            <Eye className="h-3 w-3" /> View Proof
                          </a>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.paymentStatus === "Verified"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.paymentStatus === "Rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        {ord.paymentStatus !== "Verified" ? (
                          <>
                            <button
                              onClick={() => handleVerify(ord.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => setRejectOrderId(ord.id)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Verified
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

      {/* TAB 3: PRODUCT CATALOG */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-black text-slate-900">Product Management</h2>
              <p className="text-xs text-slate-500">
                Add, edit, or adjust pricing & variants for your electronics catalog.
              </p>
            </div>
            <button
              onClick={() => setShowAddProduct(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          </div>

          <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Selling Price</th>
                    <th className="px-4 py-3">Available / Reserved</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const free = p.stockQuantity - p.reservedQuantity;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-10 w-10 object-contain rounded-lg border border-slate-200 bg-white p-1"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{p.productName}</span>
                            <span className="text-[11px] text-blue-600 font-semibold uppercase">
                              {p.brand}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{p.sku}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{p.categoryName}</td>
                        <td className="px-4 py-3 font-black text-slate-900">
                          {formatINR(p.sellingPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900">{free} available</span>
                          <span className="text-slate-400 block text-[10px]">
                            ({p.reservedQuantity} reserved)
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {p.publicationStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HYBRID INVENTORY CONSOLE */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Hybrid Stock Console & Audit Movement Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Concurrency-safe stock counters with atomic reservations and manual adjustments.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                Live Inventory Status
              </h3>
              <span className="text-xs text-slate-500">
                Click &quot;Adjust&quot; to modify stock after physical store sales or restocking
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Total Physical Stock</th>
                    <th className="px-4 py-3">Reserved (Unpaid/Pending)</th>
                    <th className="px-4 py-3">Free Available Stock</th>
                    <th className="px-4 py-3">Stock Health</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const free = p.stockQuantity - p.reservedQuantity;
                    const isLow = free <= p.lowStockThreshold;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-slate-900">{p.productName}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">{p.stockQuantity}</td>
                        <td className="px-4 py-3 font-mono text-blue-600">{p.reservedQuantity}</td>
                        <td className="px-4 py-3 font-mono font-black text-slate-900 text-sm">
                          {free}
                        </td>
                        <td className="px-4 py-3">
                          {free <= 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Low Stock Warning
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                              Optimal
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setAdjustProductId(p.id);
                              setAdjustNewQty(p.stockQuantity);
                            }}
                            className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs Table */}
          {inventoryMovements.length > 0 && (
            <div className="glass-card rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                Recent Stock Adjustment History (Audit Trail)
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {inventoryMovements.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{m.productName}</span>
                      <span className="text-slate-500 block text-[11px]">
                        Reason: {m.reason} • Performed by {m.performedBy}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-slate-400">{m.previousQuantity} units</span> ➔{" "}
                      <strong className="text-slate-900">{m.newQuantity} units</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ORDERS & DELIVERIES */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Order Lifecycle & Manual Dispatch Management
              </h2>
              <p className="text-xs text-slate-500">
                Coordinate deliveries, update customer-visible milestones, and add courier tracking.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="glass-card rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{ord.orderNumber}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-700">{ord.customerName}</span>
                    <span className="text-xs text-slate-500">({ord.customerMobile})</span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Destination: {ord.shippingAddressSnapshot.addressLine1}, {ord.shippingAddressSnapshot.city}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Payment:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.paymentStatus === "Verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>

                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">Delivery:</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {ord.deliveryStatus}
                    </span>
                  </div>

                  {ord.manualDeliveryReference && (
                    <div className="text-[11px] text-indigo-700 bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 inline-block mt-1">
                      Tracking Reference: {ord.manualDeliveryReference}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0">
                  <button
                    onClick={() => {
                      setDeliveryOrderId(ord.id);
                      setNewDeliveryStatus(ord.deliveryStatus);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Truck className="h-3.5 w-3.5" /> Update Delivery
                  </button>
                  <Link
                    href={`/orders/${ord.id}`}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 font-bold text-xs"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: STORE & UPI SETTINGS */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">Storefront & Payment Credentials</h2>
              <p className="text-xs text-slate-500">
                Configure your official UPI ID, Bank NEFT Account, and delivery policies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Store Display Name</label>
                <input
                  type="text"
                  value={tempSettings.storeName}
                  onChange={(e) => setTempSettings({ ...tempSettings, storeName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Legal Business Entity</label>
                <input
                  type="text"
                  value={tempSettings.businessEntity}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, businessEntity: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official UPI ID *</label>
                <input
                  type="text"
                  value={tempSettings.upiId}
                  onChange={(e) => setTempSettings({ ...tempSettings, upiId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-blue-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">UPI Recipient Name</label>
                <input
                  type="text"
                  value={tempSettings.upiRecipientName}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, upiRecipientName: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Name & Branch</label>
                <input
                  type="text"
                  value={tempSettings.bankName}
                  onChange={(e) => setTempSettings({ ...tempSettings, bankName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={tempSettings.bankAccountNumber}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, bankAccountNumber: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  value={tempSettings.bankIFSC}
                  onChange={(e) => setTempSettings({ ...tempSettings, bankIFSC: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Free Shipping Minimum Threshold (₹)
                </label>
                <input
                  type="number"
                  value={tempSettings.freeShippingThreshold}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      freeShippingThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {/* REJECTION MODAL */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleRejectConfirm}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-rose-600">
              <XCircle className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-900">Reject Payment Submission</h3>
            </div>
            <p className="text-xs text-slate-600">
              Per PRD Section 7.3, rejecting a payment requires a mandatory explanation that will be
              shown to the customer so they can rectify their payment details.
            </p>

            <div>
              <label className="font-bold text-xs text-slate-700 block mb-1">
                Rejection Reason *
              </label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. UTR reference not found in bank account statement; amount transferred was lower than order total."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectOrderId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELIVERY UPDATE MODAL */}
      {deliveryOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleDeliverySubmit}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-blue-600">
              <Truck className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-900">Update Delivery Milestone</h3>
            </div>

            <div>
              <label className="font-bold text-xs text-slate-700 block mb-1">
                New Delivery Status
              </label>
              <select
                value={newDeliveryStatus}
                onChange={(e) => setNewDeliveryStatus(e.target.value as DeliveryStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900"
              >
                <option value="Not Arranged">Not Arranged</option>
                <option value="Preparing for Dispatch">Preparing for Dispatch</option>
                <option value="Ready for Dispatch">Ready for Dispatch</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Delivery Attempt Failed">Delivery Attempt Failed</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-xs text-slate-700 block mb-1">
                Manual Consignment / Courier Note
              </label>
              <input
                type="text"
                value={deliveryReference}
                onChange={(e) => setDeliveryReference(e.target.value)}
                placeholder="e.g. DTDC Air Express #7839210 or Local Delivery Boy (Kalyan - 9848011223)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeliveryOrderId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
              >
                Save Delivery Update
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MANUAL STOCK ADJUSTMENT MODAL */}
      {adjustProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleAdjustStockSubmit}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-indigo-600">
              <Layers className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-900">Manual Stock Adjustment</h3>
            </div>
            <p className="text-xs text-slate-600">
              Per PRD Section 9.2, every stock adjustment must record the previous quantity, new
              quantity, and a mandatory business reason.
            </p>

            <div>
              <label className="font-bold text-xs text-slate-700 block mb-1">New Total Stock Quantity</label>
              <input
                type="number"
                min="0"
                required
                value={adjustNewQty}
                onChange={(e) => setAdjustNewQty(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-xs text-slate-700 block mb-1">Reason for Adjustment *</label>
              <input
                type="text"
                required
                value={adjustReasonText}
                onChange={(e) => setAdjustReasonText(e.target.value)}
                placeholder="e.g. Offline physical store sale, fresh inventory shipment arrived from distributor"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustProductId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
              >
                Commit Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleAddProductSubmit}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Electronics Product</h3>
              <button
                type="button"
                onClick={() => setShowAddProduct(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Sony Bravia 55 Inch 4K Google TV"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Brand *</label>
                <input
                  type="text"
                  required
                  value={newProdBrand}
                  onChange={(e) => setNewProdBrand(e.target.value)}
                  placeholder="e.g. Sony, Apple, Samsung"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Department Category *</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">MRP (₹) *</label>
                <input
                  type="number"
                  required
                  value={newProdMrp}
                  onChange={(e) => setNewProdMrp(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Physical Stock *</label>
                <input
                  type="number"
                  required
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">SKU</label>
                <input
                  type="text"
                  value={newProdSku}
                  onChange={(e) => setNewProdSku(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Product Image URL</label>
                <input
                  type="url"
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Brief highlights and specs"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddProduct(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
              >
                Publish Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
