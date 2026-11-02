"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import { ShoppingCart, Star, Zap, Heart } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, favorites, toggleFavorite } = useStore();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const isFavorite = favorites.includes(product.id);
  const freeStock = product.stockQuantity - product.reservedQuantity;
  const isOutOfStock = freeStock <= 0;
  const isLowStock = !isOutOfStock && freeStock <= product.lowStockThreshold;

  const discountPercent =
    product.mrp > product.sellingPrice
      ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
      : 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-2xl p-[1px] transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: mousePos
          ? `radial-gradient(160px circle at ${mousePos.x}px ${mousePos.y}px, rgba(37, 99, 235, 0.4), rgba(226, 232, 240, 0.8))`
          : "rgba(226, 232, 240, 0.85)",
      }}
    >
      <div className="glass-card rounded-[15px] overflow-hidden flex flex-col justify-between h-full bg-white/95">
        <div>
          {/* Product Image & Badges Container */}
          <div className="relative aspect-square w-full bg-slate-50/70 overflow-hidden flex items-center justify-center p-2.5 sm:p-4">
            <Link
              href={`/product/${product.slug}`}
              className="w-full h-full flex items-center justify-center"
            >
              <img
                src={product.images[0]}
                alt={product.productName}
                className="max-h-full max-w-full object-contain group-hover:scale-108 transition-transform duration-500 ease-out"
                loading="lazy"
              />
            </Link>

            {/* Top Floating Badges */}
            <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 z-10">
              {discountPercent > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-orange-500 text-white font-black text-[9px] sm:text-[10px] tracking-wide shadow-sm">
                  {discountPercent}% OFF
                </span>
              )}
              {product.isBestSeller && (
                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold text-[8px] sm:text-[9px] shadow-sm flex items-center gap-0.5">
                  <Zap className="h-2.5 w-2.5 fill-slate-950" /> Hot
                </span>
              )}
            </div>

            {/* Top Right Actions (Stock Badge + Favorite Heart) */}
            <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-10 flex items-center space-x-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(product.id);
                }}
                className="p-1 sm:p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 shadow-sm transition-colors"
                aria-label="Add to wishlist"
              >
                <Heart
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                    isFavorite ? "fill-rose-500 text-rose-500" : ""
                  }`}
                />
              </button>

              {isOutOfStock ? (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[8px] sm:text-[9px] border border-red-200">
                  Out
                </span>
              ) : isLowStock ? (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[8px] sm:text-[9px] border border-amber-200 animate-pulse">
                  {freeStock} left
                </span>
              ) : null}
            </div>
          </div>

          {/* Content Section */}
          <div className="p-2.5 sm:p-4">
            {/* Brand & Rating */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 mb-1">
              <span className="font-bold text-blue-600 uppercase tracking-wider truncate max-w-[80px] sm:max-w-[100px]">
                {product.brand}
              </span>
              <div className="flex items-center text-emerald-600 font-bold gap-0.5">
                <span>{product.rating || 4.8}</span>
                <Star className="h-2.5 w-2.5 fill-emerald-600" />
              </div>
            </div>

            {/* Product Title */}
            <Link href={`/product/${product.slug}`} className="block">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug min-h-[2.4em]">
                {product.productName}
              </h3>
            </Link>
          </div>
        </div>

        {/* Pricing and Action Button */}
        <div className="p-2.5 sm:p-4 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pt-2 border-t border-slate-100">
            <div>
              <div className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                {formatINR(product.sellingPrice)}
              </div>
              {product.mrp > product.sellingPrice && (
                <div className="text-[10px] sm:text-xs text-slate-400 line-through">
                  {formatINR(product.mrp)}
                </div>
              )}
            </div>

            <button
              onClick={() => addToCart(product)}
              disabled={isOutOfStock}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                isOutOfStock
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
              }`}
              aria-label={`Add ${product.productName} to cart`}
            >
              <ShoppingCart className="h-3 w-3" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
