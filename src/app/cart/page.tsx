"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  ArrowLeft,
  Truck,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateCartQuantity, cartTotal, settings, clearCart } =
    useStore();

  const shippingCharge =
    cartTotal >= settings.freeShippingThreshold ? 0 : settings.standardShippingFee;
  const orderTotal = cartTotal + shippingCharge;
  const freeShippingAway = Math.max(0, settings.freeShippingThreshold - cartTotal);

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Browse our collection of smartphones, laptops, smart TVs, and home appliances.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            Start Shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-slate-500">
            {cart.length} {cart.length === 1 ? "unique item" : "unique items"} in your bag
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:underline"
        >
          Clear Cart
        </button>
      </div>

      {/* Free Shipping Progress Indicator */}
      <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Truck className="h-5 w-5" />
        </div>
        <div className="flex-1 text-xs">
          {shippingCharge === 0 ? (
            <span className="font-bold text-emerald-700">
              🎉 Congratulations! You have unlocked FREE Express Delivery on this order.
            </span>
          ) : (
            <span className="text-slate-600">
              Add <strong className="text-slate-900">{formatINR(freeShippingAway)}</strong> more of items to get <strong className="text-emerald-700">FREE Delivery</strong>!
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => {
            const variant = item.product.variants.find((v) => v.sku === item.variantSku);
            const freeStock = item.product.stockQuantity - item.product.reservedQuantity;

            return (
              <div
                key={`${item.productId}-${item.variantSku || "base"}`}
                className="glass-card rounded-2xl p-3 sm:p-5 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-slate-50 border border-slate-100 p-1.5 flex items-center justify-center shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.productName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="space-y-0.5 sm:space-y-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                      {item.product.brand}
                    </span>
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="font-bold text-xs sm:text-sm text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 block"
                    >
                      {item.product.productName}
                    </Link>
                    {variant && (
                      <span className="inline-block text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {variant.name}
                      </span>
                    )}
                    <div className="text-xs font-bold text-slate-900 sm:hidden">
                      {formatINR(item.unitPrice)}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Price */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQuantity(item.productId, item.quantity - 1, item.variantSku)
                      }
                      className="px-2.5 py-1 text-slate-500 hover:bg-slate-100"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= freeStock}
                      onClick={() =>
                        updateCartQuantity(item.productId, item.quantity + 1, item.variantSku)
                      }
                      className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="hidden sm:block text-right min-w-[90px]">
                    <span className="text-sm font-extrabold text-slate-900 block">
                      {formatINR(item.unitPrice * item.quantity)}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-slate-400 block">
                        {formatINR(item.unitPrice)} each
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => removeFromCart(item.productId, item.variantSku)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Order Summary</h3>

            <div className="space-y-2.5 text-xs text-slate-600 pb-4 border-b border-slate-100">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">{formatINR(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping / Delivery</span>
                {shippingCharge === 0 ? (
                  <span className="font-bold text-emerald-600">FREE</span>
                ) : (
                  <span className="font-bold text-slate-900">{formatINR(shippingCharge)}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span>Payment Processing Fee</span>
                <span className="font-bold text-emerald-600">₹0 (Direct UPI/Bank)</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-sm font-bold text-slate-900">Total Payable</span>
              <span className="text-2xl font-black text-slate-900">
                {formatINR(orderTotal)}
              </span>
            </div>

            <button
              onClick={() => router.push("/checkout")}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Direct Bank & UPI Transfer with Store Verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

