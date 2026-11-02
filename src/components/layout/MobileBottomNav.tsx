"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import {
  Home,
  LayoutGrid,
  ShoppingCart,
  Package,
  ShieldCheck,
  X,
  ChevronRight,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount, categories } = useStore();
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  // If in admin dashboard, we can either hide or show relevant navigation
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-2 py-1">
        <div className="flex items-center justify-around">
          <Link
            href="/"
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
              pathname === "/"
                ? "text-blue-600 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Home className="h-5 w-5 mb-0.5" />
            Home
          </Link>

          <button
            onClick={() => setShowCategorySheet(true)}
            className="flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <LayoutGrid className="h-5 w-5 mb-0.5" />
            Categories
          </button>

          <Link
            href="/cart"
            className={`relative flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
              pathname === "/cart"
                ? "text-blue-600 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5 mb-0.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 h-4 w-4 bg-orange-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            Cart
          </Link>

          <Link
            href="/orders"
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
              pathname === "/orders"
                ? "text-blue-600 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Package className="h-5 w-5 mb-0.5" />
            Orders
          </Link>

          <Link
            href="/admin"
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
              isAdmin
                ? "text-amber-600 font-bold"
                : "text-slate-500 hover:text-amber-600"
            }`}
          >
            <ShieldCheck className="h-5 w-5 mb-0.5" />
            Admin
          </Link>
        </div>
      </nav>

      {/* Category Bottom Sheet Modal */}
      {showCategorySheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCategorySheet(false)}
          />
          <div className="relative w-full max-h-[75vh] bg-white rounded-t-3xl shadow-2xl p-5 overflow-y-auto z-50 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Browse Categories</h3>
              </div>
              <button
                onClick={() => setShowCategorySheet(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 py-2">
              <Link
                href="/"
                onClick={() => setShowCategorySheet(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/50 transition-colors"
              >
                <span className="font-semibold text-slate-800 text-sm">All Products & Deals</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  onClick={() => setShowCategorySheet(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="h-10 w-10 object-cover rounded-xl border border-slate-200"
                    />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{cat.name}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{cat.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
