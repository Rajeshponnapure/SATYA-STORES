"use client";

import React, { useState, useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import { HeroBanner } from "@/components/storefront/HeroBanner";
import { CategoryGrid } from "@/components/storefront/CategoryGrid";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  QrCode,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const { products, categories, settings } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (p.publicationStatus !== "active") return false;
        if (selectedCategory !== "all" && p.categoryId !== selectedCategory) {
          return false;
        }
        if (inStockOnly) {
          const free = p.stockQuantity - p.reservedQuantity;
          if (free <= 0) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.sellingPrice - b.sellingPrice;
        if (sortBy === "price-desc") return b.sellingPrice - a.sellingPrice;
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        return 0; // default featured
      });
  }, [products, selectedCategory, sortBy, inStockOnly]);

  const bestSellers = useMemo(() => {
    return products.filter((p) => p.isBestSeller && p.publicationStatus === "active");
  }, [products]);

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Eye-Comfort Hero Carousel */}
      <HeroBanner />

      {/* Categories Department Strip */}
      <CategoryGrid />

      {/* Best Sellers Spotlight Section */}
      {bestSellers.length > 0 && selectedCategory === "all" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Most Popular & Best Sellers
                </h2>
                <p className="text-xs text-slate-500">
                  Top verified customer favorites with high ratings
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {bestSellers.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Main Product Catalog with Interactive Filters */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              All Electronics & Appliances
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredProducts.length} verified products ready for direct dispatch
            </p>
          </div>

          {/* Filter Pills & Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Category Pills */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedCategory === "all"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cat.name.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* In Stock Only Toggle */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer shadow-sm hover:bg-slate-50">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              In Stock Only
            </label>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-slate-200">
            <SlidersHorizontal className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No products match your filter</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try clearing selected filters or view other departments.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setInStockOnly(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Manual UPI/Bank Direct Payment Trust Feature Card */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25">
            <QrCode className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1">
              <CheckCircle2 className="h-3 w-3" /> Direct Store Settlement
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Zero Payment Gateway Surcharges & Direct Verification
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Transfer funds directly to official Satya Stores (Vasavi Enterprises) UPI or Bank Account during checkout. Submit your 12-digit UTR and receipt; our store team verifies it instantly before dispatch.
            </p>
          </div>

          <div className="shrink-0 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Official Store UPI
            </span>
            <code className="text-xs font-mono font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg block border border-blue-200/60">
              {settings.upiId}
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}

