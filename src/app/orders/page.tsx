"use client";

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
  ShieldCheck,
} from "lucide-react";

export default function OrdersPage() {
  const { orders } = useStore();
  const [filter, setFilter] = useState<string>("all");

  const filteredOrders = orders.filter((ord) => {
    if (filter === "pending") return ord.paymentStatus === "Verification Pending" || ord.paymentStatus === "Awaiting Payment";
    if (filter === "verified") return ord.paymentStatus === "Verified";
    if (filter === "delivered") return ord.deliveryStatus === "Delivered";
    return true;
  });

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "Verified":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Payment Verified
          </span>
        );
      case "Verification Pending":
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold inline-flex items-center gap-1 border border-blue-200">
            <Clock className="h-3 w-3" /> Verification Pending
          </span>
        );
      case "Awaiting Payment":
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold inline-flex items-center gap-1 border border-amber-200">
            <Clock className="h-3 w-3" /> Awaiting Payment
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold inline-flex items-center gap-1 border border-rose-200">
            <AlertCircle className="h-3 w-3" /> Payment Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium">
            {status}
          </span>
        );
    }
  };

  const getDeliveryBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Delivered
          </span>
        );
      case "Dispatched":
        return (
          <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold inline-flex items-center gap-1 border border-indigo-200">
            <Truck className="h-3 w-3" /> Dispatched
          </span>
        );
      case "Preparing for Dispatch":
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold inline-flex items-center gap-1 border border-purple-200">
            <Package className="h-3 w-3" /> Preparing for Dispatch
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Order History & Tracking
          </h1>
          <p className="text-xs text-slate-500">
            Track your electronics purchases, UTR payment verifications, and delivery statuses
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === "all" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === "pending" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Verification Pending
          </button>
          <button
            onClick={() => setFilter("verified")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === "verified" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Verified
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Package className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500">You haven&apos;t placed any orders matching this filter.</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="glass-card rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-sm text-slate-900">
                    {ord.orderNumber}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">
                    {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {getPaymentBadge(ord.paymentStatus)}
                  {getDeliveryBadge(ord.deliveryStatus)}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    {ord.itemsSnapshot.map((item, idx) => (
                      <img
                        key={idx}
                        src={item.image}
                        alt={item.productName}
                        className="inline-block h-10 w-10 rounded-lg ring-2 ring-white object-cover bg-slate-50"
                      />
                    ))}
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="font-semibold block truncate max-w-sm">
                      {ord.itemsSnapshot[0].productName}
                      {ord.itemsSnapshot.length > 1 && ` + ${ord.itemsSnapshot.length - 1} more`}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Deliver to: {ord.customerName} ({ord.shippingAddressSnapshot.city})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Total Amount
                  </span>
                  <span className="text-base font-black text-slate-900">
                    {formatINR(ord.totalAmount)}
                  </span>
                </div>

                <Link
                  href={`/orders/${ord.id}`}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-600 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200/80"
                >
                  Track & Details <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
