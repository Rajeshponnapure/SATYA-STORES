"use client";

import React, { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Search, ChevronRight } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { products } = useStore();

  const matchingProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <div className="space-y-6">
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-900 font-semibold">Search Results</span>
      </nav>

      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Search Results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-xs text-slate-500">
          Found {matchingProducts.length} matching products
        </p>
      </div>

      {matchingProducts.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-200">
          <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Try searching for &quot;iPhone&quot;, &quot;Samsung&quot;, &quot;Laptop&quot;, &quot;TV&quot;, or &quot;Mixer&quot;.
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Browse All Electronics
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {matchingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading search results...</div>}>
      <SearchContent />
    </Suspense>
  );
}
