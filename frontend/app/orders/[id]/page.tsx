"use client";

import Image from "next/image";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  AlertCircle,
  ChevronLeft,
  RotateCcw,
  Zap,
  Phone,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { orders, submitPaymentDetails, initiateRazorpayPayment, settings, isLoadingBackend } =
    useStore();

  const order = orders.find((o) => o.id === orderId);

  // Re-submission state for rejected or pending payments
  const [reSubmitUtr, setReSubmitUtr] = useState("");
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [isPayingRazorpay, setIsPayingRazorpay] = useState(false);

  if (!order) {
    if (isLoadingBackend) {
      return (
        <div role="status" aria-live="polite" className="py-20 text-center text-sm font-medium text-slate-500">
          Loading order details…
        </div>
      );
    }
    return (
      <div className="py-20 text-center px-4">
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

  const handlePayWithRazorpay = async () => {
    setIsPayingRazorpay(true);
    await initiateRazorpayPayment(order);
    setIsPayingRazorpay(false);
  };

  // State Stepper Steps
  const isRefunded = order.paymentStatus === "Refunded" || order.paymentStatus === "Partially Refunded";
  const steps = [
    { label: "Order Created", done: true },
    {
      label: "Payment Verified",
      done: order.paymentStatus === "Verified" || isRefunded,
      alert: order.paymentStatus === "Rejected",
    },
    {
      label: "Confirmed",
      done:
        order.orderStatus === "Order Confirmed" ||
        order.orderStatus === "Processing" ||
        order.orderStatus === "Preparing for Dispatch" ||
        order.orderStatus === "Dispatched" ||
        order.orderStatus === "Delivered",
    },
    {
      label: "Dispatched",
      done: order.deliveryStatus === "Dispatched" || order.deliveryStatus === "Delivered",
    },
    {
      label: "Delivered",
      done: order.deliveryStatus === "Delivered",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-20 px-1 sm:px-2">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 py-1.5 px-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm transition-all"
        >
          <ChevronLeft className="h-4 w-4" /> All Orders
        </Link>
        <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200/80 px-2.5 py-1.5 rounded-xl shadow-sm">
          #{order.orderNumber}
        </span>
      </div>

      {/* Refund Banner if Order was Refunded */}
      {isRefunded && (
        <div className="p-4 sm:p-5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 space-y-2">
          <div className="flex items-start gap-2.5">
            <RotateCcw className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs sm:text-sm text-purple-900">
                Razorpay Refund Processed ({formatINR(order.refundAmount || order.totalAmount)})
              </h4>
              <p className="text-xs text-purple-800 leading-relaxed">
                The amount of {formatINR(order.refundAmount || order.totalAmount)} has been returned to your original payment method.
              </p>
              {order.refundId && (
                <p className="text-[11px] font-mono text-purple-700">
                  Razorpay Refund ID: {order.refundId}
                </p>
              )}
              {order.refundReason && (
                <p className="text-[11px] text-purple-700">Reason: {order.refundReason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Awaiting Payment Banner with Razorpay Pay Button */}
      {order.paymentStatus === "Awaiting Payment" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white space-y-3 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-200">Payment Pending</span>
              <h3 className="text-sm sm:text-base font-black">Complete Razorpay Payment</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Total Payable: <strong className="text-white">{formatINR(order.totalAmount)}</strong>
              </p>
            </div>
            <button
              type="button"
              disabled={isPayingRazorpay}
              onClick={handlePayWithRazorpay}
              className="py-2.5 px-5 rounded-xl bg-white text-blue-700 font-extrabold text-xs hover:bg-blue-50 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Zap className="h-4 w-4 fill-blue-700" />
              {isPayingRazorpay ? "Opening..." : "Pay with Razorpay"}
            </button>
          </div>
        </div>
      )}

      {/* Rejection Alert Banner if Rejected by Owner */}
      {order.paymentStatus === "Rejected" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-sm">Payment Verification Unsuccessful</h4>
              <p className="text-rose-800">
                <strong>Reason:</strong> &ldquo;{order.rejectionReason || "UTR not found"}&rdquo;
              </p>
            </div>
          </div>

          {!isResubmitting ? (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handlePayWithRazorpay}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition-all"
              >
                Pay via Razorpay Instead
              </button>
              <button
                onClick={() => setIsResubmitting(true)}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm transition-all"
              >
                Re-submit Corrected UTR
              </button>
            </div>
          ) : (
            <form onSubmit={handleReSubmit} className="flex gap-2 max-w-md pt-1">
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
      <div className="glass-card rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-900">Fulfillment Progress</h2>
          <p className="text-[11px] sm:text-xs text-slate-500">Live order confirmation and courier journey</p>
        </div>

        {/* Stepper (Responsive) */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
          {steps.map((st, i) => (
            <div key={i} className="flex flex-col items-center space-y-1 relative">
              <div
                className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold z-10 transition-colors ${
                  st.alert
                    ? "bg-rose-500 text-white ring-2 ring-rose-100"
                    : st.done
                    ? "bg-emerald-500 text-white ring-2 ring-emerald-50"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {st.alert ? "!" : st.done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[9px] sm:text-[11px] font-bold line-clamp-1 ${
                  st.alert ? "text-rose-600" : st.done ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment & Delivery Snapshots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Payment Snapshot */}
        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
              Payment Settlement
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                order.paymentStatus === "Verified"
                  ? "bg-emerald-100 text-emerald-800"
                  : isRefunded
                  ? "bg-purple-100 text-purple-800"
                  : order.paymentStatus === "Rejected"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>

          <div className="text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-semibold text-slate-900">
                {order.paymentMethod === "RAZORPAY" ? "Razorpay Gateway" : order.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] max-w-[170px] truncate">
                {order.razorpayPaymentId || order.paymentReference || "Awaiting"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Amount:</span>
              <span className="font-black text-slate-900">{formatINR(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Details Snapshot */}
        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
              Delivery Coordination
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
              {order.deliveryStatus}
            </span>
          </div>

          <div className="text-xs space-y-1 text-slate-600">
            <p className="font-bold text-slate-900">{order.shippingAddressSnapshot.recipientName}</p>
            <p className="line-clamp-1">{order.shippingAddressSnapshot.addressLine1}</p>
            <p>
              {order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.state} -{" "}
              {order.shippingAddressSnapshot.postalCode}
            </p>
            <p className="font-medium text-slate-800 pt-0.5">
              📞 {order.shippingAddressSnapshot.mobileNumber}
            </p>
            {order.manualDeliveryReference && (
              <p className="mt-1 font-mono text-[11px] text-blue-700 bg-blue-50 p-1 rounded">
                Tracking: {order.manualDeliveryReference}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items Snapshot */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
          Purchased Electronics ({order.itemsSnapshot.length})
        </h3>

        <div className="divide-y divide-slate-100">
          {order.itemsSnapshot.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Image width={640} height={640} unoptimized
                  src={item.image}
                  alt={item.productName}
                  className="h-11 w-11 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate">
                    {item.productName}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    SKU: {item.sku} • Qty: {item.quantity}
                  </span>
                </div>
              </div>

              <div className="text-right text-xs shrink-0">
                <span className="font-bold text-slate-900 block">
                  {formatINR(item.unitPrice * item.quantity)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatINR(item.unitPrice)} ea
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{order.shippingCharge === 0 ? "FREE" : formatINR(order.shippingCharge)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-100 text-sm font-black text-slate-900">
            <span>Total Amount</span>
            <span>{formatINR(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Support Action */}
      <div className="flex gap-2">
        <a
          href={`tel:${settings?.supportPhone || "+919849012345"}`}
          className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
        >
          <Phone className="h-4 w-4" /> Call Store Support
        </a>
        <a
          href={`https://wa.me/91${(settings?.supportPhone || "9849012345").replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp Dispatch
        </a>
      </div>
    </div>
  );
}
