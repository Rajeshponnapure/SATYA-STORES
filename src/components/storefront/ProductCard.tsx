"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import { ShoppingCart, Star, ShieldCheck, Zap } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();

  const freeStock = product.stockQuantity - product.reservedQuantity;
  const isOutOfStock = freeStock <= 0;
  const isLowStock = !isOutOfStock && freeStock <= product.lowStockThreshold;

  const discountPercent =
    product.mrp > product.sellingPrice
      ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
      : 0;

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group border border-slate-200/80">
      {/* Product Image & Badges Container */}
      <div className="relative aspect-square w-full bg-slate-50/70 overflow-hidden flex items-center justify-center p-4">
        <Link href={`/product/${product.slug}`} className="w-full h-full flex items-center justify-center">
          <img
            src={product.images[0]}
            alt={product.productName}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </Link>

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white font-extrabold text-[10px] tracking-wide shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {product.isBestSeller && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] shadow-sm flex items-center gap-0.5">
              <Zap className="h-3 w-3 fill-slate-950" /> Best Seller
            </span>
          )}
        </div>

        {/* Stock Badge (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] border border-red-200">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200 animate-pulse">
              Only {freeStock} Left
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 font-medium text-[10px] border border-emerald-200/80">
              In Stock
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-semibold text-blue-600 uppercase tracking-wider">
              {product.brand}
            </span>
            <span className="truncate max-w-[120px]">{product.categoryName}</span>
          </div>

          {/* Product Title */}
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
              {product.productName}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
              <span>{product.rating || 4.8}</span>
              <Star className="h-2.5 w-2.5 ml-0.5 fill-white" />
            </div>
            <span className="text-[11px] text-slate-500">
              ({product.reviewCount || 45} reviews)
            </span>
          </div>

          {/* Short Warranty or Spec Highlight */}
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{product.warranty}</span>
          </div>
        </div>

        {/* Pricing and Action */}
        <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold text-slate-900">
              {formatINR(product.sellingPrice)}
            </span>
            {product.mrp > product.sellingPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
              isOutOfStock
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
            }`}
            aria-label={`Add ${product.productName} to cart`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
