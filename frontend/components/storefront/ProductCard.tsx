"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import { ShoppingCart, Star, Zap, Heart, Check } from "lucide-react";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { motion } from "framer-motion";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, favorites, toggleFavorite, cart } = useStore();

  const isFavorite = favorites.includes(product.id);
  const isInCart = cart.some((it) => it.productId === product.id);
  const freeStock = product.stockQuantity - product.reservedQuantity;
  const isOutOfStock = freeStock <= 0;
  const isLowStock = !isOutOfStock && freeStock <= product.lowStockThreshold;

  const discountPercent =
    product.mrp > product.sellingPrice
      ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
      : 0;

  return (
    <SpotlightCard
      className="group h-full"
      spotlightColor="rgba(37, 99, 235, 0.08)"
      borderColor="rgba(37, 99, 235, 0.35)"
      enableTilt={true}
    >
      <div className="flex flex-col justify-between h-full">
        <div>
          {/* Product Image & Badges Container */}
          <div className="relative aspect-square w-full bg-slate-50/70 overflow-hidden flex items-center justify-center p-3 sm:p-5 border-b border-slate-100">
            <Link
              href={`/product/${product.slug}`}
              className="w-full h-full flex items-center justify-center"
            >
              <img
                src={product.images[0]}
                alt={product.productName}
                className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
                loading="lazy"
              />
            </Link>

            {/* Top Left Floating Badges */}
            <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
              {discountPercent > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[9px] sm:text-[10px] tracking-wide shadow-sm shadow-orange-500/20">
                  {discountPercent}% OFF
                </span>
              )}
              {product.isBestSeller && (
                <span className="px-1.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[8px] sm:text-[9px] shadow-sm flex items-center gap-0.5">
                  <Zap className="h-2.5 w-2.5 fill-slate-950" /> Hot
                </span>
              )}
            </div>

            {/* Top Right Actions (Stock Badge + Favorite Heart) */}
            <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 flex items-center space-x-1">
              <motion.button
                type="button"
                whileTap={{ scale: 0.8 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(product.id);
                }}
                className={`min-h-10 min-w-10 sm:min-h-11 sm:min-w-11 p-2 rounded-xl backdrop-blur-md shadow-sm transition-all ${
                  isFavorite
                    ? "bg-rose-50 text-rose-500 border border-rose-200"
                    : "bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white border border-slate-200/60"
                }`}
                aria-label="Add to wishlist"
              >
                <Heart
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                    isFavorite ? "fill-rose-500 text-rose-500" : ""
                  }`}
                />
              </motion.button>

              {isOutOfStock ? (
                <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-[8px] sm:text-[9px] border border-rose-200">
                  Out
                </span>
              ) : isLowStock ? (
                <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-[8px] sm:text-[9px] border border-amber-200 animate-pulse">
                  {freeStock} left
                </span>
              ) : null}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-3 sm:p-4">
            {/* Brand & Rating */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1">
              <span className="font-extrabold text-blue-600 uppercase tracking-wider truncate max-w-[90px] sm:max-w-[120px]">
                {product.brand}
              </span>
              <div className="flex items-center text-amber-500 font-bold gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-slate-800 text-[10px]">{product.rating || 4.8}</span>
              </div>
            </div>

            {/* Product Title */}
            <Link href={`/product/${product.slug}`} className="block">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug min-h-[2.5em]">
                {product.productName}
              </h3>
            </Link>
          </div>
        </div>

        {/* Pricing and Action Button */}
        <div className="p-3 sm:p-4 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-100">
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

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => addToCart(product)}
              disabled={isOutOfStock}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isOutOfStock
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : isInCart
                  ? "bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 group-hover:shadow-md"
              }`}
              aria-label={`Add ${product.productName} to cart`}
            >
              {isInCart ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>In Bag</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Add</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
