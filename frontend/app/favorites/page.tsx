"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import { Heart, ShoppingCart, Trash2, ArrowLeft, Store, Star } from "lucide-react";

export default function FavoritesPage() {
  const { favorites, products, toggleFavorite, addToCart } = useStore();

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10 pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              My Saved Wishlist
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {favoriteProducts.length} items saved for later purchase
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="p-12 text-center bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm max-w-md mx-auto my-12">
          <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Your Wishlist is Empty</h2>
          <p className="text-xs text-slate-500 mb-6">
            Tap the heart icon on any smartphone, laptop, TV or appliance to save it here!
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 py-2.5 px-5 rounded-full bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-500/20"
          >
            <Store className="h-4 w-4" />
            <span>Explore Electronics Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {favoriteProducts.map((product) => {
            const discountPercent = Math.round(
              ((product.mrp - product.sellingPrice) / product.mrp) * 100
            );

            return (
              <div
                key={product.id}
                className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image & Wishlist remove button */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 mb-3 border border-slate-100">
                    <img
                      src={product.images[0]}
                      alt={product.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {discountPercent > 0 && (
                      <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm">
                        {discountPercent}% OFF
                      </span>
                    )}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white text-rose-500 shadow-sm"
                      title="Remove from favorites"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Brand & Name */}
                  <p className="text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                    {product.brand}
                  </p>
                  <Link
                    href={`/product/${product.slug}`}
                    className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 hover:text-blue-600 transition-colors mt-0.5"
                  >
                    {product.productName}
                  </Link>

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center space-x-1 mt-1 text-[11px] text-amber-500">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-700">{product.rating}</span>
                      <span className="text-slate-400">({product.reviewCount || 12})</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mt-2 flex items-baseline space-x-1.5">
                    <span className="text-sm sm:text-base font-black text-slate-900">
                      {formatINR(product.sellingPrice)}
                    </span>
                    <span className="text-[11px] text-slate-400 line-through">
                      {formatINR(product.mrp)}
                    </span>
                  </div>
                </div>

                {/* Move to Cart button */}
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      addToCart(product);
                      toggleFavorite(product.id);
                    }}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
