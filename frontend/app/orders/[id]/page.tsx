"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Package,
  MapPin,
  CreditCard,
  QrCode,
  ShieldCheck,
  ChevronLeft,
  FileCheck2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { orders, submitPaymentDetails, settings } = useStore();

  const order = orders.find((o) => o.id === orderId);

  // Re-submission state for rejected or pending payments
  const [reSubmitUtr, setReSubmitUtr] = useState("");
  const [isResubmitting, setIsResubmitting] = useState(false);

  if (!order) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Order not found</h2>
        <Link href="/orders" className="mt-4 inline-block text-sm text-blue-600 font-bold hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const handleReSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reSubmitUtr || reSubmitUtr.trim().length < 6) {
      toast.error("Please enter a valid 12-digit UTR reference.");
      return;
    }
    await submitPaymentDetails(order.id, reSubmitUtr);
    setIsResubmitting(false);
  };

  // State Stepper Steps
  const steps = [
    { label: "Order Created", done: true },
    {
      label: "Payment Submitted",
      done:
        order.paymentStatus === "Payment Details Submitted" ||
        order.paymentStatus === "Verification Pending" ||
        order.paymentStatus === "Verified",
    },
    {
      label: "Store Verified",
      done: order.paymentStatus === "Verified",
      alert: order.paymentStatus === "Rejected",
    },
    {
      label: "Order Confirmed",
      done:
        order.orderStatus === "Order Confirmed" ||
        order.orderStatus === "Processing" ||
        order.orderStatus === "Preparing for Dispatch" ||
        order.orderStatus === "Dispatched" ||
        order.orderStatus === "Delivered",
    },
    {
      label: "Dispatched",
      done:
        order.deliveryStatus === "Dispatched" ||
        order.deliveryStatus === "Delivered",
    },
    {
      label: "Delivered",
      done: order.deliveryStatus === "Delivered",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> All Orders
        </Link>
        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
          Order #{order.orderNumber}
        </span>
      </div>

      {/* Rejection Alert Banner if Rejected by Owner */}
      {order.paymentStatus === "Rejected" && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Payment Verification Unsuccessful</h4>
              <p className="text-xs text-rose-800">
                <strong>Reason given by store owner:</strong> &ldquo;{order.rejectionReason || "UTR not found in bank statement"}&rdquo;
              </p>
              <p className="text-xs text-rose-700">
                Please double-check your bank or UPI transaction reference and submit the corrected 12-digit UTR below.
              </p>
            </div>
          </div>

          {!isResubmitting ? (
            <button
              onClick={() => setIsResubmitting(true)}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm transition-all"
            >
              Re-submit Corrected UTR Reference
            </button>
          ) : (
            <form onSubmit={handleReSubmit} className="flex gap-2 max-w-md pt-2">
              <input
                type="text"
                required
                value={reSubmitUtr}
                onChange={(e) => setReSubmitUtr(e.target.value)}
                placeholder="Enter 12-digit UTR"
                className="flex-1 bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm"
              >
                Submit
              </button>
            </form>
          )}
        </div>
      )}

      {/* Interactive Order Stepper Card */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Order & Fulfillment Journey</h2>
          <p className="text-xs text-slate-500">Live multi-state verification and delivery tracker</p>
        </div>

        {/* Horizontal Stepper (Desktop) */}
        <div className="hidden sm:grid grid-cols-6 gap-2 text-center">
          {steps.map((st, i) => (
            <div key={i} className="flex flex-col items-center space-y-2 relative">
              {i < steps.length - 1 && (
                <div
                  className={`absolute top-3.5 left-1/2 w-full h-0.5 z-0 ${
                    st.done && steps[i + 1].done ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                  st.alert
                    ? "bg-rose-500 text-white ring-4 ring-rose-100"
                    : st.done
                    ? "bg-emerald-500 text-white ring-4 ring-emerald-50"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {st.alert ? "!" : st.done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[11px] font-bold ${
                  st.alert ? "text-rose-600" : st.done ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>

        {/* Mobile Vertical Stepper */}
        <div className="sm:hidden space-y-3 pl-2">
          {steps.map((st, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  st.alert
                    ? "bg-rose-500 text-white"
                    : st.done
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {st.alert ? "!" : st.done ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-bold ${
                  st.alert ? "text-rose-600" : st.done ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment & Verification Snapshot */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Payment Settlement
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                order.paymentStatus === "Verified"
                  ? "bg-emerald-100 text-emerald-800"
                  : order.paymentStatus === "Rejected"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>

          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-semibold text-slate-900">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UTR / Reference No:</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {order.paymentReference || "Awaiting Submission"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Transferred:</span>
              <span className="font-black text-slate-900">{formatINR(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Verification Agent:</span>
              <span className="text-slate-700 font-medium">Vasavi Enterprises Store Owner</span>
            </div>
          </div>
        </div>

        {/* Delivery Details Snapshot */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Delivery Coordination
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
              {order.deliveryStatus}
            </span>
          </div>

          <div className="text-xs space-y-1.5 text-slate-600">
            <p className="font-bold text-slate-900">{order.shippingAddressSnapshot.recipientName}</p>
            <p>{order.shippingAddressSnapshot.addressLine1}</p>
            {order.shippingAddressSnapshot.addressLine2 && (
              <p>{order.shippingAddressSnapshot.addressLine2}</p>
            )}
            <p>
              {order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.state} -{" "}
              {order.shippingAddressSnapshot.postalCode}
            </p>
            <p className="font-medium text-slate-800">
              📞 {order.shippingAddressSnapshot.mobileNumber}
            </p>

            {order.manualDeliveryReference && (
              <div className="mt-2 p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px]">
                <strong>Consignment Tracking:</strong> {order.manualDeliveryReference}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Immutable Items Snapshot */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900">Purchased Electronics Snapshot</h3>

        <div className="divide-y divide-slate-100">
          {order.itemsSnapshot.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.productName}
                  className="h-12 w-12 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                    {item.productName}
                  </h4>
                  {item.variantDescription && (
                    <span className="text-[10px] text-slate-500 block">
                      {item.variantDescription}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</span>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="font-bold text-slate-900 block">
                  {formatINR(item.unitPrice * item.quantity)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {item.quantity} x {formatINR(item.unitPrice)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping Charge</span>
            <span>{order.shippingCharge === 0 ? "FREE" : formatINR(order.shippingCharge)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-black text-slate-900">
            <span>Total Paid / Payable</span>
            <span>{formatINR(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

