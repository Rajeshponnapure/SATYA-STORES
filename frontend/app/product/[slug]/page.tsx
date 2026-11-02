"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Zap,
  ChevronRight,
  CreditCard,
  QrCode,
  Heart,
  MessageSquarePlus,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Review } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const {
    products,
    addToCart,
    favorites,
    toggleFavorite,
    currentUser,
    submitReview,
    fetchProductReviews,
  } = useStore();

  const product = products.find((p) => p.slug === slug);

  // Selected variant state
  const [selectedVariantSku, setSelectedVariantSku] = useState<string>(
    product?.variants[0]?.sku || ""
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (product) {
      fetchProductReviews(product.id).then((r) => setReviews(r));
    }
  }, [product, fetchProductReviews]);

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Product not found</h2>
        <Link href="/" className="mt-4 inline-block text-sm text-blue-600 font-bold hover:underline">
          Return to Storefront
        </Link>
      </div>
    );
  }

  const isFavorite = favorites.includes(product.id);
  const selectedVariant = product.variants.find((v) => v.sku === selectedVariantSku);
  const activePrice = selectedVariant ? selectedVariant.price : product.sellingPrice;
  const activeMrp = selectedVariant ? selectedVariant.mrp : product.mrp;

  const freeStock = product.stockQuantity - product.reservedQuantity;
  const isOutOfStock = freeStock <= 0;
  const isLowStock = !isOutOfStock && freeStock <= product.lowStockThreshold;

  const discountPercent =
    activeMrp > activePrice ? Math.round(((activeMrp - activePrice) / activeMrp) * 100) : 0;

  const handleAddToCart = () => {
    addToCart(product, selectedVariantSku, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedVariantSku, quantity);
    router.push("/checkout");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;

    setIsSubmittingReview(true);
    await submitReview(product.id, newRating, reviewTitle, reviewComment);
    setIsSubmittingReview(false);
    setShowReviewForm(false);
    setReviewTitle("");
    setReviewComment("");
    // Refresh reviews
    const refreshed = await fetchProductReviews(product.id);
    setReviews(refreshed);
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap py-1">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
        <Link
          href={`/category/${product.categoryId.replace("cat-", "")}`}
          className="hover:text-blue-600 transition-colors"
        >
          {product.categoryName}
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">
          {product.productName}
        </span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 aspect-square flex items-center justify-center overflow-hidden relative shadow-sm">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.productName}
              className="max-h-full max-w-full object-contain transition-all duration-300"
            />

            {/* Favorite Wishlist Button */}
            <button
              onClick={() => toggleFavorite(product.id)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 shadow-md transition-colors z-10"
              aria-label="Add to wishlist"
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
              />
            </button>

            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-orange-500 text-white font-extrabold text-xs shadow-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl p-2 bg-white border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? "border-blue-600 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Vasavi Assured Guarantee Card */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-blue-700 font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>Vasavi Enterprises Guarantee</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Every unit dispatched from our Vijayawada hub is 100% brand new, serial-tracked, and backed by manufacturer warranty.
            </p>
          </div>
        </div>

        {/* Right: Details & Purchase Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                {product.brand}
              </span>
              <span className="text-xs font-mono text-slate-400">
                SKU: {selectedVariant?.sku || product.sku}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {product.productName}
            </h1>

            {/* Rating Stars & Reviews */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center px-2 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-bold shadow-sm">
                <span>{product.rating || 4.8}</span>
                <Star className="h-3 w-3 ml-1 fill-white" />
              </div>
              <span className="text-xs font-medium text-slate-500">
                {product.reviewCount || 45} Verified Customer Ratings
              </span>
            </div>
          </div>

          {/* Pricing & Stock Status */}
          <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                {formatINR(activePrice)}
              </span>
              {activeMrp > activePrice && (
                <span className="text-base text-slate-400 line-through font-medium">
                  MRP {formatINR(activeMrp)}
                </span>
              )}
              {/* Favorite Wishlist Button */}
            <button
              onClick={() => toggleFavorite(product.id)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 shadow-md transition-colors z-10"
              aria-label="Add to wishlist"
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
              />
            </button>

            {discountPercent > 0 && (
                <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  Save {formatINR(activeMrp - activePrice)} ({discountPercent}% OFF)
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              Inclusive of all taxes. Free express shipping on this order.
            </p>

            {/* Stock Availability Pill */}
            <div className="pt-2">
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                  <AlertCircle className="h-4 w-4" /> Out of Stock for Online Order
                </div>
              ) : isLowStock ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold animate-pulse">
                  <AlertCircle className="h-4 w-4" /> Hurry, only {freeStock} units left in stock!
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4" /> In Stock — Ready for Manual Dispatch
                </div>
              )}
            </div>
          </div>

          {/* Variants Selector (Color / Storage / Specs) */}
          {product.variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Configuration / Variant:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariantSku === variant.sku;
                  return (
                    <button
                      key={variant.sku}
                      type="button"
                      onClick={() => setSelectedVariantSku(variant.sku)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900">{variant.name}</span>
                      <span className="text-xs font-extrabold text-blue-700 mt-1">
                        {formatINR(variant.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= freeStock}
                  onClick={() => setQuantity((q) => Math.min(freeStock, q + 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="h-4 w-4 fill-white" /> Buy Now
              </button>
            </div>
          </div>

          {/* Description & Technical Specifications Accordion */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Description</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Specifications Table */}
            {product.specifications && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">Technical Specifications</h3>
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white/80">
                  <table className="w-full text-xs divide-y divide-slate-100">
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(product.specifications).map(([key, val], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                          <td className="px-4 py-2.5 font-semibold text-slate-500 w-1/3">
                            {key}
                          </td>
                          <td className="px-4 py-2.5 text-slate-900 font-medium">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews & Feedback Section */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Customer Reviews & Ratings</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">
                {reviews.length} Verified
              </span>
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= (product.rating || 4.8)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800">
                {product.rating || 4.8} out of 5
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>{showReviewForm ? "Cancel Review" : "Write a Review"}</span>
          </button>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Share Your Experience
            </h3>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Your Rating</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= newRating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Headline</label>
              <input
                type="text"
                required
                placeholder="e.g. Excellent build quality, fast dispatch!"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Review</label>
              <textarea
                required
                rows={3}
                placeholder="Tell other shoppers about performance, packaging, or warranty..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="py-2 px-5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmittingReview ? "Submitting..." : "Submit Review"}</span>
            </button>
          </form>
        )}

        {/* Reviews List */}
        <div className="mt-4 divide-y divide-slate-100">
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No reviews yet. Be the first to share your experience!
            </p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="py-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs">{rev.userName}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-100">
                      Verified Buyer
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${
                        s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                  <span className="font-bold text-slate-800 text-xs ml-1">{rev.title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-0.5">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Floating Action Bar */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 p-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase">Total</span>
          <span className="text-base font-black text-slate-900 leading-none">
            {formatINR(activePrice * quantity)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end max-w-xs">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-blue-600 text-blue-600 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 disabled:opacity-40"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Add
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-40"
          >
            <Zap className="h-3.5 w-3.5 fill-white" /> Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

