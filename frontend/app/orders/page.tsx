"use client";

import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ChevronRight,
  RotateCcw,
  CreditCard,
} from "lucide-react";

export default function OrdersPage() {
  const { orders, currentUser, initiateRazorpayPayment, isLoadingBackend } = useStore();
  const [filter, setFilter] = useState<string>("all");

  const relevantOrders = currentUser
    ? orders.filter((o) => o.userId === currentUser.id || o.customerEmail === currentUser.email)
    : orders;

  const filteredOrders = relevantOrders.filter((ord) => {
    if (filter === "pending")
      return ord.paymentStatus === "Verification Pending" || ord.paymentStatus === "Awaiting Payment";
    if (filter === "verified") return ord.paymentStatus === "Verified";
    if (filter === "refunded")
      return ord.paymentStatus === "Refunded" || ord.paymentStatus === "Partially Refunded";
    if (filter === "delivered") return ord.deliveryStatus === "Delivered";
    return true;
  });

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "Verified":
        return (
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-200 whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3" /> Paid & Verified
          </span>
        );
      case "Refunded":
        return (
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold inline-flex items-center gap-1 border border-purple-200 whitespace-nowrap">
            <RotateCcw className="h-3 w-3" /> Refunded
          </span>
        );
      case "Partially Refunded":
        return (
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold inline-flex items-center gap-1 border border-purple-200 whitespace-nowrap">
            <RotateCcw className="h-3 w-3" /> Part-Refunded
          </span>
        );
      case "Verification Pending":
        return (
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold inline-flex items-center gap-1 border border-blue-200 whitespace-nowrap">
            <Clock className="h-3 w-3" /> In Verification
          </span>
        );
      case "Awaiting Payment":
        return (
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold inline-flex items-center gap-1 border border-amber-200 whitespace-nowrap">
            <Clock className="h-3 w-3" /> Awaiting Payment
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold inline-flex items-center gap-1 border border-rose-200 whitespace-nowrap">
            <AlertCircle className="h-3 w-3" /> Payment Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  const getDeliveryBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return (
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-200 whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3" /> Delivered
          </span>
        );
      case "Dispatched":
        return (
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold inline-flex items-center gap-1 border border-indigo-200 whitespace-nowrap">
            <Truck className="h-3 w-3" /> Dispatched
          </span>
        );
      case "Preparing for Dispatch":
        return (
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold inline-flex items-center gap-1 border border-purple-200 whitespace-nowrap">
            <Package className="h-3 w-3" /> Preparing
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 max-w-4xl mx-auto px-1 sm:px-2">
      {/* Header */}
      <div className="flex flex-col gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Order History & Tracking
          </h1>
          <p className="text-xs text-slate-500">
            Track your electronics purchases, Razorpay settlements, and courier dispatches
          </p>
        </div>

        {/* Filter Pills with Horizontal Touch Scroll */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setFilter("all")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === "all"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({relevantOrders.length})
          </button>
          <button
            onClick={() => setFilter("verified")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === "verified"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Paid / Verified
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === "pending"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("refunded")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === "refunded"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Refunded
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === "delivered"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Delivered
          </button>
        </div>
      </div>

      {isLoadingBackend ? (
        <div role="status" aria-live="polite" className="glass-card rounded-3xl p-8 text-center border border-slate-200 text-sm font-semibold text-slate-500">
          Loading your orders…
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center border border-slate-200 space-y-3">
          <Package className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500">You haven&apos;t placed any orders matching this filter.</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Browse Electronics
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
            >
              {/* Order Meta Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                    {ord.orderNumber}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-[11px] sm:text-xs text-slate-500">
                    {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {getPaymentBadge(ord.paymentStatus)}
                  {getDeliveryBadge(ord.deliveryStatus)}
                </div>
              </div>

              {/* Items & Address */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 shrink-0 overflow-hidden">
                  {ord.itemsSnapshot.slice(0, 3).map((item, idx) => (
                    <Image width={640} height={640} unoptimized
                      key={idx}
                      src={item.image}
                      alt={item.productName}
                      className="inline-block h-11 w-11 sm:h-12 sm:w-12 rounded-xl ring-2 ring-white object-contain bg-slate-50 border border-slate-100"
                    />
                  ))}
                </div>
                <div className="text-xs text-slate-700 min-w-0 flex-1">
                  <span className="font-bold block truncate max-w-sm">
                    {ord.itemsSnapshot[0].productName}
                    {ord.itemsSnapshot.length > 1 && ` + ${ord.itemsSnapshot.length - 1} more`}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    Ship to: {ord.customerName} ({ord.shippingAddressSnapshot.city})
                  </span>
                  <span className="text-[10px] text-blue-600 font-mono block">
                    {ord.paymentMethod === "RAZORPAY"
                      ? `Razorpay: ${ord.razorpayPaymentId || ord.paymentReference || "Direct Online"}`
                      : `Mode: ${ord.paymentMethod}`}
                  </span>
                </div>
              </div>

              {/* Bottom Price & Action Row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Total Amount
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900">
                    {formatINR(ord.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {ord.paymentStatus === "Awaiting Payment" && (
                    <button
                      type="button"
                      onClick={() => initiateRazorpayPayment(ord)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Pay Now</span>
                    </button>
                  )}
                  <Link
                    href={`/orders/${ord.id}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-600 font-bold text-xs flex items-center gap-1 transition-colors border border-slate-200/80 active:scale-95"
                  >
                    <span>Track</span> <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
