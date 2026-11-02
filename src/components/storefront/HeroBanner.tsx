"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";

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
    <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 my-4 sm:my-6 group">
      {/* Background Image with Ambient Gradient Overlay */}
      <div className="relative h-[280px] sm:h-[360px] md:h-[420px] w-full overflow-hidden">
        <img
          src={current.imageUrl}
          alt={current.title}
          className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Eye-Friendly Gradient Mask */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent flex items-center" />
      </div>

      {/* Hero Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-16 max-w-2xl text-white">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/90 text-white text-xs font-bold tracking-wide uppercase w-fit mb-3 shadow-sm backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" />
          {current.tag}
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white mb-2 drop-shadow-sm">
          {current.title}
        </h2>

        <p className="text-xs sm:text-base text-slate-200 font-medium mb-6 line-clamp-2 max-w-lg">
          {current.subtitle}
        </p>

        <div className="flex items-center gap-3">
          <Link
            href={current.destinationUrl}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition-all transform active:scale-95"
          >
            Explore Deals <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all"
          >
            Manage Banners
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
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % activeBanners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2">
            {activeBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === i ? "w-7 bg-orange-500" : "w-2 bg-white/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
