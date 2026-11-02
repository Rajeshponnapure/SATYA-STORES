import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, CreditCard, Phone, Store } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/60 backdrop-blur-md pb-16 lg:pb-0">
      {/* 1. Concise Trust Badges Row */}
      <div className="border-b border-slate-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs">
          <div className="flex items-center space-x-2 text-slate-700">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="font-semibold">100% Brand Genuine</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-700">
            <CreditCard className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Direct UPI / Bank Transfer</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-700">
            <Truck className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-semibold">Fast Insured Delivery</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-700">
            <Phone className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="font-semibold">+91 98490 12345 (Support)</span>
          </div>
        </div>
      </div>

      {/* 2. Streamlined Essential Footer Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">SATYA STORES</span>
            <span className="text-[10px] text-slate-400 font-semibold ml-1.5 uppercase">Vasavi Enterprises</span>
          </div>
        </div>

        {/* Essential Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">Catalog</Link>
          <Link href="/orders" className="hover:text-blue-600 transition-colors">Track Orders</Link>
          <Link href="/favorites" className="hover:text-blue-600 transition-colors">Wishlist</Link>
          <Link href="/pages/about-us" className="hover:text-blue-600 transition-colors">About Us</Link>
          <Link href="/pages/shipping-policy" className="hover:text-blue-600 transition-colors">Shipping & Returns</Link>
        </div>

        {/* Copyright */}
        <div className="text-[11px] text-slate-400 text-center md:text-right">
          © {new Date().getFullYear()} Satya Stores. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
