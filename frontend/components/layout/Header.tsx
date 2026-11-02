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

  // If currently in admin dashboard, we do not render customer storefront header
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Active top marquee
  const topMarquee = marquees.find((m) => m.position === "header" && m.status === "active") || marquees[0];

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

  const openMobileSearch = () => {
    setIsMobileSearchVisible(true);
    setTimeout(() => searchInputRef.current?.focus(), 150);
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
      {/* 1. Dynamic Announcement Marquee Strip */}
      {topMarquee && (
        <div
          className="text-xs py-1.5 px-3 overflow-hidden font-medium border-b border-black/10 transition-colors"
          style={{
            backgroundColor: topMarquee.backgroundColor || "#0F172A",
            color: topMarquee.textColor || "#F8FAFC",
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-[marquee_24s_linear_infinite] hover:[animation-play-state:paused]">
                {topMarquee.link ? (
                  <Link href={topMarquee.link} className="hover:underline flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase">
                      Notice
                    </span>
                    <span>{topMarquee.text}</span>
                  </Link>
                ) : (
                  <span>{topMarquee.text}</span>
                )}
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3 shrink-0 text-[11px] opacity-90">
              <Link href="/pages/about-us" className="hover:underline">About Store</Link>
              <span>•</span>
              <Link href="/orders" className="hover:underline">Track Order</Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Store Navigation Bar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Mobile Drawer Hamburger & Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link href="/" className="flex items-center space-x-2 group">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <span className="text-base sm:text-xl font-black tracking-tight text-slate-900 block leading-tight">
                    SATYA<span className="text-blue-600">STORES</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold hidden sm:block leading-none">
                    Vasavi Enterprises
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Center Search Bar with Instant Autocomplete */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-4 relative">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="text"
                  placeholder="Search mobiles, laptops, OLED TVs, mixer grinders..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-10 pr-10 py-2 rounded-full border border-slate-200 bg-slate-50/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                />
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>

              {/* Autocomplete Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    Matching Products
                  </div>
                  <div className="divide-y divide-slate-100">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center space-x-3 p-3 hover:bg-blue-50/50 transition-colors"
                      >
                        <img
                          src={product.images[0]}
                          alt={product.productName}
                          className="h-10 w-10 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {product.productName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {product.brand} • {product.categoryName}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-blue-600">
                            {formatINR(product.sellingPrice)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="p-2.5 bg-slate-50 text-center border-t border-slate-100">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center space-x-1"
                    >
                      <span>View all results for &quot;{searchQuery}&quot;</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side Icons & Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Mobile Search Button */}
              <button
                onClick={openMobileSearch}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Search products"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist Button */}
              <Link
                href="/favorites"
                className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors relative"
                aria-label="Favorites"
              >
                <Heart className={`h-5 w-5 ${favorites.length > 0 ? "text-rose-500 fill-rose-500" : ""}`} />
                {favorites.length > 0 && (
                  <span className="absolute 1 top-1 right-1 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>

              {/* Cart Button with Count Badge */}
              <Link
                href="/cart"
                className="flex items-center space-x-2 py-1.5 px-2.5 sm:px-3 rounded-full bg-slate-100/90 hover:bg-slate-200/80 transition-all text-slate-800 font-semibold text-xs sm:text-sm relative"
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 text-slate-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-4 w-4 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">Cart</span>
              </Link>

              {/* Customer Account Dropdown or Sign In */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="flex items-center space-x-1.5 py-1.5 px-2.5 sm:px-3 rounded-full border border-slate-200 hover:border-blue-400 bg-white transition-all text-xs font-semibold text-slate-800"
                  >
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <span className="hidden sm:inline max-w-[80px] truncate">
                      {currentUser.fullName.split(" ")[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>

                  {isAccountMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in"
                      onMouseLeave={() => setIsAccountMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {currentUser.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>My Account & Address</span>
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Package className="h-4 w-4" />
                        <span>My Order History</span>
                      </Link>
                      <Link
                        href="/favorites"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                        <span>Saved Wishlist ({favorites.length})</span>
                      </Link>
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            logoutCustomer();
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Link
                    href="/auth/login"
                    className="py-1.5 px-3 rounded-full text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="hidden sm:inline-flex py-1.5 px-3 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Mobile Expanding Search Input Bar */}
        {isMobileSearchVisible && (
          <div className="lg:hidden px-3 pb-3 pt-1 border-t border-slate-100 bg-white">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products, brands, models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setIsMobileSearchVisible(false)}
                className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* 4. Category Navigation Strip (Desktop) */}
        <div className="hidden lg:block bg-slate-50/60 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between text-xs py-2 font-medium text-slate-600">
              <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar">
                <Link
                  href="/"
                  className={`flex items-center space-x-1.5 hover:text-blue-600 transition-colors ${
                    pathname === "/" ? "text-blue-600 font-bold" : ""
                  }`}
                >
                  <Store className="h-4 w-4" />
                  <span>All Categories</span>
                </Link>

                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className={`flex items-center space-x-1.5 hover:text-blue-600 transition-colors whitespace-nowrap ${
                      pathname === `/category/${cat.slug}` ? "text-blue-600 font-bold" : ""
                    }`}
                  >
                    {getCategoryIcon(cat.slug)}
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>

              <div className="flex items-center space-x-4 shrink-0 text-[11px] text-slate-500">
                <span className="flex items-center space-x-1 text-emerald-600 font-semibold">
                  <Sparkles className="h-3 w-3" />
                  <span>Direct UPI & Instant Dispatch</span>
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
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                    <Store className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">Satya Stores</span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Snapshot in Mobile Drawer */}
              {currentUser ? (
                <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                  <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                  <div className="mt-2.5 flex items-center space-x-2">
                    <Link
                      href="/account"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Profile & Address
                    </Link>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        logoutCustomer();
                      }}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="my-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs font-bold text-blue-900">Sign in to your account</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Save orders, carts, and wishlist items.
                  </p>
                  <div className="mt-2.5 flex items-center space-x-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="py-1 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="py-1 px-3 rounded-lg bg-white text-blue-600 border border-blue-200 text-xs font-semibold"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}

              {/* Category Links */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Shop Categories
                </p>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <div className="flex items-center space-x-2.5">
                      {getCategoryIcon(cat.slug)}
                      <span>{cat.name}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom Drawer Links */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <Link
                href="/orders"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center space-x-2 py-1.5 text-slate-700 font-medium"
              >
                <Package className="h-4 w-4 text-blue-600" />
                <span>Track My Orders</span>
              </Link>
              <Link
                href="/pages/about-us"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="block py-1 hover:text-slate-800"
              >
                About Vasavi Enterprises
              </Link>
              <Link
                href="/pages/contact-us"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="block py-1 hover:text-slate-800"
              >
                Help & Contact Support
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
