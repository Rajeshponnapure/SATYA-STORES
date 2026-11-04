"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck, Zap, Truck } from "lucide-react";

export function HeroBanner() {
  const { promotions } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = promotions.filter((p) => p.status === "active");

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[currentIndex];

  return (
    <div className="space-y-3 my-2 sm:my-6">
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 group">
        {/* Background Image with Ambient Gradient Overlay */}
        <div className="relative h-[230px] sm:h-[340px] md:h-[420px] w-full overflow-hidden">
          <img
            src={current.imageUrl}
            alt={current.title}
            className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Eye-Friendly Gradient Mask */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-slate-900/30 flex items-center" />
        </div>

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-10 md:px-16 max-w-2xl text-white">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] sm:text-xs font-black tracking-wide uppercase w-fit max-w-full mb-2 shadow-sm backdrop-blur-sm animate-pulse-subtle">
            <Sparkles className="h-3 w-3" />
            {current.tag}
          </div>

          <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight text-white mb-1.5 sm:mb-2 drop-shadow-sm line-clamp-3 break-words">
            {current.title}
          </h2>

          <p className="text-[11px] sm:text-sm text-slate-200 font-medium mb-3 sm:mb-5 line-clamp-2 max-w-md">
            {current.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href={current.destinationUrl}
              className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 group/btn"
            >
              <span>Explore Deals</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/pages/about-us"
              className="inline-flex items-center px-3.5 py-2 sm:py-3 rounded-xl sm:rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all"
            >
              Vasavi Guarantee
            </Link>
          </div>
        </div>

        {/* Prev / Next Slider Controls */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
              }
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 min-h-10 min-w-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % activeBanners.length)}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 min-h-10 min-w-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-1.5">
              {activeBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all ${
                    currentIndex === i ? "w-5 sm:w-7 bg-orange-500" : "w-1.5 sm:w-2 bg-white/50"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* React Bits Inspired: Live Floating Tech Feature Badges */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="glass-card rounded-xl py-2 px-1.5 sm:px-3 border border-slate-200/80 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-700">
          <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span className="truncate">Fast Store Dispatch</span>
        </div>
        <div className="glass-card rounded-xl py-2 px-1.5 sm:px-3 border border-slate-200/80 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-700">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">100% Genuine Tech</span>
        </div>
        <div className="glass-card rounded-xl py-2 px-1.5 sm:px-3 border border-slate-200/80 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-700">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
          <span className="truncate">Direct UPI Verify</span>
        </div>
      </div>
    </div>
  );
}
