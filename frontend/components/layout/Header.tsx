"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  LogOut,
  Package,
  Smartphone,
  Laptop,
  Tv,
  Coffee,
  Headphones,
  Store,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    cartCount,
    favorites,
    categories,
    products,
    currentUser,
    logoutCustomer,
    marquees,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide customer header inside secret admin portal
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Active top marquee
  const topMarquee =
    marquees.find((m) => m.position === "header" && m.status === "active") || marquees[0];

  // Instant autocomplete filtering
  const searchResults =
    searchQuery.trim().length > 1
      ? products
          .filter(
            (p) =>
              p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 6)
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
    <header className="sticky top-0 z-40 w-full select-none">
      {/* 1. Ultra-Sleek Top Announcement Marquee Ticker */}
      {topMarquee && (
        <div
          className="text-[11px] font-medium py-1.5 px-3 sm:px-6 overflow-hidden border-b border-black/10 transition-all shadow-sm"
          style={{
            backgroundColor: topMarquee.backgroundColor || "#0B1329",
            color: topMarquee.textColor || "#F8FAFC",
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-[marquee_26s_linear_infinite] hover:[animation-play-state:paused]">
                <Link
                  href={topMarquee.link || "/category/mobiles"}
                  className="hover:opacity-90 inline-flex items-center space-x-2"
                >
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                    SPECIAL OFFER
                  </span>
                  <span className="font-semibold tracking-wide">{topMarquee.text}</span>
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-4 shrink-0 text-[11px] opacity-80">
              <span className="flex items-center space-x-1">
                <Phone className="h-3 w-3 text-amber-400" />
                <span>Call Store: +91 98490 12345</span>
              </span>
              <span>•</span>
              <Link href="/orders" className="hover:text-amber-300 transition-colors">
                Track Consignment
              </Link>
              <span>•</span>
              <span className="text-amber-400 font-bold">100% Genuine Warranty</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Executive Header Bar */}
      <div className="bg-[#F4F6F9]/95 sm:bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between min-h-14 sm:min-h-16 gap-1.5 sm:gap-4">
            {/* Left: Mobile Hamburger & Brand Identity */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 active:scale-95 transition-all"
                aria-label="Toggle navigation drawer"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-600/25 group-hover:scale-105 transition-transform duration-300">
                  <Store className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1 whitespace-nowrap">
                    <span className="text-sm min-[390px]:text-base sm:text-xl font-black tracking-tight text-slate-900 leading-none">
                      SATYA
                    </span>
                    <span className="text-sm min-[390px]:text-base sm:text-xl font-black tracking-tight text-blue-600 leading-none">
                      STORES
                    </span>
                  </div>
                  <span className="text-[8px] sm:text-[8.5px] uppercase font-bold tracking-wider sm:tracking-widest text-slate-400 leading-tight mt-0.5">
                    Vasavi Enterprises
                  </span>
                </div>
              </Link>
            </div>

            {/* Middle: Expanded Intelligent Search Bar (Desktop) */}
            <div ref={searchContainerRef} className="hidden lg:flex flex-1 max-w-xl mx-4 relative">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="text"
                  placeholder="Search smartphones, MacBook, OLED 4K TVs, mixer grinders..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/90 hover:bg-white text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                />
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 p-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>

              {/* Autocomplete Flyout */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2.5 text-[10px] font-black tracking-wider text-slate-400 uppercase bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span>Products Matching &quot;{searchQuery}&quot;</span>
                    <span className="text-blue-600">{searchResults.length} found</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center space-x-3 p-3 hover:bg-blue-50/60 transition-colors group"
                      >
                        <img
                          src={product.images[0]}
                          alt={product.productName}
                          className="h-10 w-10 object-contain rounded-xl bg-slate-50 border border-slate-100 p-1 shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate transition-colors">
                            {product.productName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {product.brand} • in {product.categoryName}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-slate-900 block">
                            {formatINR(product.sellingPrice)}
                          </span>
                          {product.mrp > product.sellingPrice && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatINR(product.mrp)}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="p-2.5 bg-slate-50 text-center border-t border-slate-100">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
                    >
                      <span>Search All Results</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Quick Customer Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Mobile Search Button */}
              <button
                onClick={() => {
                  setIsMobileSearchVisible(!isMobileSearchVisible);
                  setTimeout(() => searchInputRef.current?.focus(), 150);
                }}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 active:scale-95 transition-all"
                aria-label="Search items"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist Button with Counter */}
              <Link
                href="/favorites"
                className="hidden sm:flex p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 active:scale-95 transition-all relative"
                aria-label="Wishlist"
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    favorites.length > 0 ? "text-rose-500 fill-rose-500" : ""
                  }`}
                />
                {favorites.length > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shadow-sm">
                    {favorites.length}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <Link
                href="/cart"
                className="hidden sm:flex items-center space-x-2 py-2 px-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md shadow-slate-900/15"
              >
                <div className="relative">
                  <ShoppingCart className="h-4.5 w-4.5 text-amber-400" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 h-4 w-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce shadow">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline font-extrabold text-xs">Cart</span>
              </Link>

              {/* Customer Account / Sign In */}
              {currentUser ? (
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="flex items-center space-x-1.5 py-1.5 px-2.5 sm:px-3 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-400 transition-all text-xs font-bold text-slate-800 shadow-sm"
                  >
                    <div className="h-6 w-6 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <span className="hidden sm:inline max-w-[80px] truncate">
                      {currentUser.fullName.split(" ")[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>

                  {isAccountMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                      onMouseLeave={() => setIsAccountMenuOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {currentUser.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <UserIcon className="h-4 w-4 text-blue-600" />
                        <span>Profile & Shipping Address</span>
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Package className="h-4 w-4 text-blue-600" />
                        <span>Track My Orders</span>
                      </Link>
                      <Link
                        href="/favorites"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Heart className="h-4 w-4 text-rose-500" />
                        <span>Saved Wishlist ({favorites.length})</span>
                      </Link>
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            logoutCustomer();
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-1">
                  <Link
                    href="/auth/login"
                    className="py-1.5 px-3 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-200/50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="hidden sm:inline-flex py-1.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Mobile Expanding Search Input */}
        {isMobileSearchVisible && (
          <div className="lg:hidden px-3 pb-3 pt-1 border-t border-slate-200/80 bg-white">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search smartphones, 4K TVs, laptops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setIsMobileSearchVisible(false)}
                className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* 4. Desktop Category Rail */}
        <div className="hidden lg:block bg-white/70 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between text-xs py-2 font-semibold text-slate-600">
              <div className="flex items-center space-x-7 overflow-x-auto no-scrollbar">
                <Link
                  href="/"
                  className={`flex items-center space-x-1.5 hover:text-blue-600 transition-colors ${
                    pathname === "/" ? "text-blue-600 font-extrabold" : ""
                  }`}
                >
                  <Store className="h-4 w-4" />
                  <span>All Catalog</span>
                </Link>

                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className={`flex items-center space-x-1.5 hover:text-blue-600 transition-colors whitespace-nowrap ${
                      pathname === `/category/${cat.slug}` ? "text-blue-600 font-extrabold" : ""
                    }`}
                  >
                    {getCategoryIcon(cat.slug)}
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>

              <div className="flex items-center space-x-4 shrink-0 text-[11px] text-slate-500">
                <span className="flex items-center space-x-1 text-emerald-600 font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Direct Bank / UPI Verified</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Mobile Side Drawer Navigation */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-left">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-sm">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-sm block leading-none">Satya Stores</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Vasavi Enterprises</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Customer Account card in drawer */}
              {currentUser ? (
                <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                  <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                  <div className="mt-2.5 flex items-center space-x-3 text-xs">
                    <Link
                      href="/account"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Profile & Address
                    </Link>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        logoutCustomer();
                      }}
                      className="font-bold text-rose-600 hover:underline"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="my-4 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60">
                  <p className="text-xs font-bold text-blue-900">Welcome to Satya Stores</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Sign in to track orders, saved addresses and wishlist.
                  </p>
                  <div className="mt-2.5 flex items-center space-x-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="py-1.5 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="py-1.5 px-3 rounded-xl bg-white text-blue-600 border border-blue-200 text-xs font-bold"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1">
                  Departments
                </p>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(cat.slug)}
                      <span>{cat.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom Support info */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <Link
                href="/orders"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center space-x-2 py-1.5 text-slate-800 font-bold"
              >
                <Package className="h-4 w-4 text-blue-600" />
                <span>Track My Orders</span>
              </Link>
              <div className="flex items-center space-x-2 py-1 text-slate-600 text-[11px]">
                <Phone className="h-3.5 w-3.5 text-blue-600" />
                <span>+91 98490 12345 (Store Support)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
