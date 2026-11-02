"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
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
  SlidersHorizontal,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, categories, products, currentUser, loginAsOwner, loginAsCustomer } =
    useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

  // Live search filtering
  const searchResults =
    searchQuery.trim().length > 1
      ? products
          .filter(
            (p) =>
              p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5)
      : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      setIsMobileSearchVisible(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
      {/* Top Announcement & Testing Switcher Bar */}
      <div className="bg-slate-900 text-slate-200 px-3 py-1.5 text-[11px] font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 truncate">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[9px] sm:text-[10px] font-bold tracking-wide uppercase shrink-0">
              Vasavi Enterprises
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="text-slate-300 truncate hidden md:inline">
              Direct Bank & UPI Transfer with Store Verification
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Quick Testing Role Switcher */}
            <div className="flex items-center bg-slate-800 rounded-full p-0.5 border border-slate-700 text-[10px]">
              <button
                onClick={() => loginAsCustomer()}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  currentUser?.role === "customer"
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => loginAsOwner()}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  currentUser?.role === "owner"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Owner
              </button>
            </div>

            <Link
              href="/admin"
              className="hidden sm:flex items-center text-slate-300 hover:text-amber-400 transition-colors text-[11px]"
            >
              <ShieldCheck className="h-3 w-3 mr-1 text-amber-400" />
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main Responsive Header */}
      <div className="glass-panel border-b border-slate-200/80 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Mobile Menu Trigger + Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base sm:text-xl shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-none sm:leading-tight">
                  SATYA STORES
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-wider uppercase hidden xs:block">
                  Vasavi Enterprises
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search phones, laptops, 4K TVs, appliances..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/80 rounded-full py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </form>

            {/* Instant Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsSearchOpen(false)} />
                <div className="absolute top-12 left-0 right-0 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-150">
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
                        className="h-10 w-10 object-contain rounded-lg border border-slate-100 p-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-600">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.categoryName} •{" "}
                          <span className="text-emerald-600 font-bold">
                            {formatINR(item.sellingPrice)}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="View Shopping Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin Portal Shortcut */}
            <Link
              href="/admin"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden xs:inline">Admin</span>
            </Link>
          </div>
        </div>

        {/* Mobile Dropdown Search Field */}
        {isMobileSearchVisible && (
          <div className="md:hidden px-3 pb-3 pt-1 border-t border-slate-100 bg-white/95">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Search phones, laptops, 4K TVs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </form>
          </div>
        )}

        {/* Category Horizontal Ribbon (Desktop) */}
        <nav className="hidden lg:block border-t border-slate-200/60 bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex items-center space-x-6 h-10 text-xs font-semibold text-slate-700">
              <li>
                <Link
                  href="/"
                  className={`hover:text-blue-600 transition-colors pb-2.5 border-b-2 ${
                    pathname === "/"
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent"
                  }`}
                >
                  All Products
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className={`flex items-center gap-1.5 hover:text-blue-600 transition-colors pb-2.5 border-b-2 ${
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

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white shadow-2xl flex flex-col z-50 p-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Satya Stores</h3>
                  <p className="text-[10px] text-slate-500">Vasavi Enterprises</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Departments
              </h4>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 hover:bg-blue-50"
                  >
                    <span>All Products & Deals</span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <span className="flex items-center gap-2">
                        {getCategoryIcon(cat.slug)}
                        {cat.name}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Shortcuts
              </h4>
              <Link
                href="/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600"
              >
                <span>My Orders & Tracking</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              </Link>
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 rounded-xl"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-600" /> Owner Administration
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-amber-400" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
