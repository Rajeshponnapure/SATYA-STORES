import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, CreditCard, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/70 backdrop-blur-md pb-16 lg:pb-0">
      {/* Trust Badges Bar */}
      <div className="border-b border-slate-200/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900">100% Genuine Tech</h5>
              <p className="text-[11px] text-slate-500">Official Brand Warranty</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900">Verified Bank / UPI</h5>
              <p className="text-[11px] text-slate-500">Direct, zero gateway charge</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900">Fast Local Dispatch</h5>
              <p className="text-[11px] text-slate-500">Safe handled packaging</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900">Vasavi Store Support</h5>
              <p className="text-[11px] text-slate-500">Dedicated store phone assist</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base">
              S
            </div>
            <span className="text-base font-extrabold text-slate-900">Satya Stores</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            A premium consumer electronics destination operated by <strong className="text-slate-700">Vasavi Enterprises</strong>. Bringing you smartphones, laptops, smart TVs, and kitchen appliances with personal verified service.
          </p>
          <div className="text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              <span>+91 98490 12345</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-blue-600" />
              <span>support@satyastores.in</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              <span>Vasavi Enterprises, Main Road, Vijayawada</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
            Shop By Department
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li><Link href="/category/mobiles" className="hover:text-blue-600 transition-colors">Smartphones & 5G Mobiles</Link></li>
            <li><Link href="/category/laptops" className="hover:text-blue-600 transition-colors">Personal & Business Laptops</Link></li>
            <li><Link href="/category/televisions" className="hover:text-blue-600 transition-colors">4K OLED & QLED Smart TVs</Link></li>
            <li><Link href="/category/home-appliances" className="hover:text-blue-600 transition-colors">Mixer Grinders & Kitchen Stoves</Link></li>
            <li><Link href="/category/accessories" className="hover:text-blue-600 transition-colors">GaN Fast Chargers & Smartwatches</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
            Store Policies
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li><Link href="/pages/about-us" className="hover:text-blue-600 transition-colors">About Vasavi Enterprises</Link></li>
            <li><Link href="/pages/shipping-policy" className="hover:text-blue-600 transition-colors">Shipping & Delivery Terms</Link></li>
            <li><Link href="/pages/refund-policy" className="hover:text-blue-600 transition-colors">Refund & Return Guidelines</Link></li>
            <li><Link href="/pages/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
            <li><Link href="/pages/privacy" className="hover:text-blue-600 transition-colors">Privacy & Data Security</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
            Payment & Verification
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            We operate on confirmed manual UPI and Bank transfers. After transferring funds, submit your 12-digit UTR reference for instant store owner verification.
          </p>
          <div className="p-3 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs">
            <span className="font-semibold text-slate-800 block mb-0.5">Official UPI ID:</span>
            <code className="text-[11px] font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200 block truncate">
              vasavienterprises@okaxis
            </code>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/60 py-4 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© 2026 Satya Stores (Vasavi Enterprises). All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with modern Next.js 15, eye-comfort design system & Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
}

