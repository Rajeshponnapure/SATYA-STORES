"use client";

import React, { useState, useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import { HeroBanner } from "@/components/storefront/HeroBanner";
import { CategoryGrid } from "@/components/storefront/CategoryGrid";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  SlidersHorizontal,
  CheckCircle2,
  QrCode,
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
        return 0;
      });
  }, [products, selectedCategory, sortBy, inStockOnly]);

  const bestSellers = useMemo(() => {
    return products.filter((p) => p.isBestSeller && p.publicationStatus === "active");
  }, [products]);

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Eye-Comfort Hero Carousel */}
      <HeroBanner />

      {/* Categories Department Strip */}
      <CategoryGrid />

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && selectedCategory === "all" && (
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="p-1 sm:p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                Best Sellers & Top Picks
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500">
                Most popular electronics with verified customer ratings
              </p>
            </div>
          </div>

          {/* 2-Col Mobile Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {bestSellers.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Main Catalog with Mobile-Optimized Filters */}
      <section className="space-y-4 sm:space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              All Electronics & Appliances
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Showing {filteredProducts.length} verified items
            </p>
          </div>

          {/* Horizontal Scrolling Filter Pills on Mobile */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
            <div className="flex items-center bg-slate-200/80 p-0.5 sm:p-1 rounded-xl text-xs font-bold shrink-0">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all ${
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
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cat.name.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* In-Stock Toggle */}
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-700 cursor-pointer shadow-sm shrink-0 whitespace-nowrap">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              In Stock
            </label>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-[11px] sm:text-xs font-bold rounded-xl py-1.5 pl-2.5 pr-6 shadow-sm focus:outline-none shrink-0"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* 2-Column Mobile Grid for Products */}
        {filteredProducts.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border border-slate-200">
            <SlidersHorizontal className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No products match your filter</h3>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setInStockOnly(false);
              }}
              className="mt-3 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Manual UPI Trust Banner (Responsive) */}
      <section className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <QrCode className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1">
              <CheckCircle2 className="h-3 w-3" /> Direct Store Settlement
            </div>
            <h3 className="text-sm sm:text-lg font-black text-slate-900 leading-snug">
              Zero Payment Gateway Charges & Direct Bank/UPI Verification
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Pay via official UPI ID <strong>{settings.upiId}</strong>. Verified personally by the store owner before dispatch.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
