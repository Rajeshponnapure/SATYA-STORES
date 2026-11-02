"use client";

import React, { useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ChevronRight, ArrowLeft, SlidersHorizontal } from "lucide-react";

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { categories, products } = useStore();

  const [sortBy, setSortBy] = useState<string>("featured");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  const currentCategory = categories.find((c) => c.slug === slug);

  const categoryProducts = useMemo(() => {
    if (!currentCategory) return [];
    return products
      .filter((p) => {
        if (p.categoryId !== currentCategory.id) return false;
        if (p.publicationStatus !== "active") return false;
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
  }, [currentCategory, products, inStockOnly, sortBy]);

  if (!currentCategory) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Category not found</h2>
        <Link href="/" className="mt-4 inline-block text-sm text-blue-600 font-bold hover:underline">
          Return to Storefront
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-900 font-semibold">{currentCategory.name}</span>
      </nav>

      {/* Category Hero Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="space-y-2 z-10 max-w-xl">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-wider">
            Verified Department
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {currentCategory.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {currentCategory.description}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            {categoryProducts.length} items available in stock
          </p>
        </div>

        <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-md">
          <img
            src={currentCategory.image}
            alt={currentCategory.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer shadow-sm hover:bg-slate-50">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            In Stock Only
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Sort by:</span>
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

      {/* Products Grid */}
      {categoryProducts.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-200">
          <SlidersHorizontal className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No products found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Try unchecking &quot;In Stock Only&quot; or check back shortly.
          </p>
          <button
            onClick={() => setInStockOnly(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
