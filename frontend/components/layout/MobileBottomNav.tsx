"use client";

import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import {
  Home,
  LayoutGrid,
  ShoppingCart,
  Heart,
  User as UserIcon,
  X,
  ChevronRight,
  Package,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount, favorites, currentUser, categories } = useStore();
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  // Hide mobile bottom nav completely inside the private admin dashboard.
  if (pathname.startsWith("/admin") || pathname.startsWith("/_owner/")) {
    return null;
  }

  const favCount = favorites.length;

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around">
          <Link
            href="/"
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
              pathname === "/"
                ? "text-blue-600 font-bold scale-105"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Home className="h-5 w-5 mb-0.5" />
            Home
          </Link>

          <button
            onClick={() => setShowCategorySheet(true)}
            className="flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <LayoutGrid className="h-5 w-5 mb-0.5" />
            Categories
          </button>

          <Link
            href="/favorites"
            className={`relative flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
              pathname === "/favorites"
                ? "text-rose-600 font-bold scale-105"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className="relative">
              <Heart className={`h-5 w-5 mb-0.5 ${pathname === "/favorites" ? "fill-rose-500 text-rose-500" : ""}`} />
              {favCount > 0 && (
                <span className="absolute -top-1 -right-2 h-4 w-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                  {favCount}
                </span>
              )}
            </div>
            Wishlist
          </Link>

          <Link
            href="/cart"
            className={`relative flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
              pathname === "/cart"
                ? "text-orange-600 font-bold scale-105"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5 mb-0.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2.5 h-4 w-4 bg-orange-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </div>
            Cart
          </Link>

          <Link
            href={currentUser ? "/account" : "/auth/login"}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
              pathname.startsWith("/account") || pathname.startsWith("/auth")
                ? "text-blue-600 font-bold scale-105"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {currentUser?.profileImage ? (
              <span className="relative mb-0.5 h-5 w-5 overflow-hidden rounded-full ring-1 ring-slate-300">
                <Image src={currentUser.profileImage} alt="" aria-hidden="true" fill sizes="20px" unoptimized className="object-cover" />
              </span>
            ) : (
              <UserIcon className="h-5 w-5 mb-0.5" />
            )}
            {currentUser ? "Account" : "Sign In"}
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
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl p-5 overflow-y-auto z-10 border-t border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <LayoutGrid className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Browse Categories</h3>
              </div>
              <button
                onClick={() => setShowCategorySheet(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mt-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  onClick={() => setShowCategorySheet(false)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Image width={640} height={640} unoptimized
                      src={cat.image}
                      alt={cat.name}
                      className="w-11 h-11 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{cat.name}</h4>
                      <p className="text-[11px] text-slate-500">{cat.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <Link
                href="/orders"
                onClick={() => setShowCategorySheet(false)}
                className="flex items-center space-x-1.5 py-2 px-3 rounded-lg bg-slate-100 font-medium"
              >
                <Package className="h-4 w-4 text-blue-600" />
                <span>Track My Orders</span>
              </Link>
              <button
                onClick={() => setShowCategorySheet(false)}
                className="py-2 px-4 rounded-lg bg-blue-600 text-white font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
