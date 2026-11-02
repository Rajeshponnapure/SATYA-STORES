"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  User,
  ShieldCheck,
  Smartphone,
  Laptop,
  Tv,
  Coffee,
  Headphones,
  Menu,
  X,
  Store,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { cartCount, categories, products, currentUser, loginAsOwner, loginAsCustomer } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  // Live search filtering
  const searchResults = searchQuery.trim().length > 1
    ? products.filter(
        (p) =>
          p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "mobiles":
        return <Smartphone className="h-4 w-4" />;
      case "laptops":
        return <Laptop className="h-4 w-4" />;
      case "televisions":
        return <Tv className="h-4 w-4" />;
      case "home-appliances":
        return <Coffee className="h-4 w-4" />;
      case "accessories":
        return <Headphones className="h-4 w-4" />;
      default:
        return <Store className="h-4 w-4" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top Notification Announcement Bar */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-semibold tracking-wide uppercase">
              Vasavi Enterprises
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="text-slate-300">
              Direct Bank & UPI Payment with Instant Verification
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Quick Role Switcher Pill for Pair-Programming Testing */}
            <div className="flex items-center bg-slate-800/80 rounded-full p-0.5 border border-slate-700 text-[11px]">
              <button
                onClick={() => loginAsCustomer()}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  currentUser?.role === "customer"
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Customer Mode
              </button>
              <button
                onClick={() => loginAsOwner()}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  currentUser?.role === "owner"
                    ? "bg-amber-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Owner Mode
              </button>
            </div>

            <Link
              href="/admin"
              className="hidden sm:flex items-center text-slate-300 hover:text-orange-400 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-orange-400" />
              Owner Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Main Glass Header */}
      <div className="glass-panel border-b border-slate-200/80 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  SATYA STORES
                </span>
                <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase -mt-1">
                  Electronics & Appliances
                </span>
              </div>
            </Link>
          </div>

          {/* Central Live Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search phones, laptops, 4K TVs, appliances..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/80 rounded-full py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Instant Search Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsSearchOpen(false)}
                />
                <div className="absolute top-12 left-0 right-0 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                  {searchResults.map((item) => (
                    <Link
                      key={item.id}
                      href={`/product/${item.slug}`}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-blue-50/70 transition-colors group"
                    >
                      <img
                        src={item.images[0]}
                        alt={item.productName}
                        className="h-11 w-11 object-cover rounded-lg border border-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.categoryName} • <span className="text-emerald-600 font-semibold">{formatINR(item.sellingPrice)}</span>
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                  <div className="p-2 bg-slate-50 text-center">
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery)}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      View all results for &ldquo;{searchQuery}&rdquo; <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Header Navigation Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/orders"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            >
              My Orders
            </Link>

            {/* Shopping Cart Button */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors group"
              aria-label="View Shopping Cart"
            >
              <ShoppingCart className="h-5 w-5 group-hover:scale-105 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 h-5 w-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md animate-cart-bump">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin Portal Shortcut Button */}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-medium shadow-sm transition-all hover:shadow"
            >
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>

        {/* Category Navigation Ribbon (Desktop) */}
        <nav className="hidden lg:block border-t border-slate-200/60 bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex items-center space-x-8 h-11 text-xs font-medium text-slate-700">
              <li>
                <Link
                  href="/"
                  className={`hover:text-blue-600 transition-colors pb-3 border-b-2 ${
                    pathname === "/" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent"
                  }`}
                >
                  All Products
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className={`flex items-center gap-1.5 hover:text-blue-600 transition-colors pb-3 border-b-2 ${
                      pathname === `/category/${cat.slug}`
                        ? "border-blue-600 text-blue-600 font-bold"
                        : "border-transparent"
                    }`}
                  >
                    {getCategoryIcon(cat.slug)}
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-white shadow-2xl flex flex-col z-50 p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Satya Stores</h3>
                  <p className="text-[10px] text-slate-500">Vasavi Enterprises</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Categories
              </h4>
              <ul className="space-y-1">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        {getCategoryIcon(cat.slug)}
                        {cat.name}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Links
              </h4>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:text-blue-600"
                  >
                    My Orders & Tracking
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 font-semibold"
                  >
                    <ShieldCheck className="h-4 w-4" /> Owner Admin Portal
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

