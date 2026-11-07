"use client";

import Image from "next/image";
import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";

export function CategoryGrid() {
  const { categories, products } = useStore();

  return (
    <div className="my-4 sm:my-8">
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <div>
          <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
            Shop By Category
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Certified electronics guaranteed by Vasavi Enterprises
          </p>
        </div>
      </div>

      {/* Mobile Horizontal Snap List / Desktop Grid */}
      <div className="flex sm:grid sm:grid-cols-5 gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="glass-card rounded-2xl p-2 sm:p-4 hover:shadow-md transition-all group flex flex-col items-center text-center border border-slate-200/80 min-w-[95px] sm:min-w-0 shrink-0"
            >
              <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl bg-slate-100 overflow-hidden mb-1.5 sm:mb-3 p-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Image width={640} height={640} unoptimized
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover rounded-lg sm:rounded-xl"
                />
              </div>

              <h3 className="font-bold text-[11px] sm:text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.2em] leading-snug">
                {cat.name}
              </h3>

              <p className="text-[9px] sm:text-[11px] text-slate-400">
                {count} {count === 1 ? "item" : "items"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
