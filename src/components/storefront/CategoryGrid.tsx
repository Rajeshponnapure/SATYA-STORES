"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ChevronRight } from "lucide-react";

export function CategoryGrid() {
  const { categories, products } = useStore();

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Featured Categories
          </h2>
          <p className="text-xs text-slate-500">
            Explore authentic electronics guaranteed by Vasavi Enterprises
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="glass-card rounded-2xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300 group flex flex-col items-center text-center border border-slate-200/80"
            >
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-slate-100 overflow-hidden mb-3 p-1.5 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover rounded-xl"
                />
              </div>

              <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {cat.name}
              </h3>

              <p className="text-[11px] text-slate-400 mt-0.5">
                {count} {count === 1 ? "product" : "products"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
