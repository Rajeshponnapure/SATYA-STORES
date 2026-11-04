"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Truck, RefreshCw, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const pageContent: Record<
  string,
  { title: string; subtitle: string; icon: LucideIcon; content: string[] }
> = {
  "about-us": {
    title: "About Satya Stores & Vasavi Enterprises",
    subtitle: "Over two decades of trusted consumer electronics retail in Andhra Pradesh",
    icon: ShieldCheck,
    content: [
      "Satya Stores is the dedicated e-commerce storefront of Vasavi Enterprises, founded with a clear mission: to make authentic consumer electronics, mobile devices, laptops, televisions, and kitchen appliances directly accessible to customers at transparent retail prices.",
      "Unlike giant impersonal marketplaces filled with unverified third-party sellers, every order placed with Satya Stores is managed, inspected, and verified directly by our store owner and dedicated dispatch personnel.",
      "We operate transparently with direct manual UPI and Bank transfer settlements, ensuring zero hidden checkout charges, real-time stock allocation, and genuine brand warranties across all our products.",
    ],
  },
  "shipping-policy": {
    title: "Shipping & Delivery Policy",
    subtitle: "Safe packaging, local dispatch, and transparent tracking updates",
    icon: Truck,
    content: [
      "All confirmed orders are processed and packed at our central Vijayawada store within 24 to 48 hours of payment verification.",
      "Orders above ₹999 qualify for FREE Express Shipping across our delivery coverage zones. Orders below ₹999 incur a standard flat shipping fee of ₹49.",
      "Once your order is handed over to our verified courier partner (such as DTDC, Professional Couriers) or our local store delivery personnel, our store owner updates your order with a manual consignment reference and notes.",
      "Customers can track their live order journey (Preparing for Dispatch ➔ Dispatched ➔ Delivered) in real-time through the My Orders tab.",
    ],
  },
  "refund-policy": {
    title: "Refund & Cancellation Guidelines",
    subtitle: "Fair, straightforward cancellation and replacement terms",
    icon: RefreshCw,
    content: [
      "Customers may cancel their order anytime while it is in 'Awaiting Payment' or 'Verification Pending' status directly from the order details screen without any penalty.",
      "If a payment was transferred but rejected by the store owner due to an incorrect amount or mismatched UTR, the customer can submit the corrected reference, or request a complete reversal.",
      "In the rare event of receiving a physically damaged or defective electronic appliance, notify us within 48 hours with unboxing photos. We arrange immediate door replacement or refund.",
    ],
  },
  terms: {
    title: "Terms and Conditions of Service",
    subtitle: "Clear policies governing purchases, stock reservations, and payments",
    icon: FileText,
    content: [
      "By placing an order on Satya Stores, customers agree that orders are processed upon successful verification of manual Bank or UPI transfer details by the store owner.",
      "Product inventory is held under a temporary 30-minute reservation upon order creation. If payment details are not submitted within the reservation window, stock is automatically returned to available inventory.",
      "All product pricing, specifications, and warranty guarantees reflect genuine manufacturer terms.",
    ],
  },
  privacy: {
    title: "Privacy and Data Protection",
    subtitle: "Safeguarding your personal data and transaction confidentiality",
    icon: ShieldCheck,
    content: [
      "Vasavi Enterprises respects customer privacy. We collect only necessary details required for order delivery: recipient name, mobile number, and shipping address.",
      "We NEVER ask for or store sensitive credentials such as your UPI PIN, banking passwords, OTPs, or debit/credit card numbers.",
      "All payment transaction references (UTRs) and optional screenshot proofs are stored strictly for audit and fraud prevention purposes and are accessible only to the store owner.",
    ],
  },
};

export default function CMSPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "about-us";
  const page = pageContent[slug] || pageContent["about-us"];
  const IconComponent = page.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-900 font-semibold">{page.title}</span>
      </nav>

      {/* Hero Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-blue-600">
          <IconComponent className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Official Policy</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {page.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">{page.subtitle}</p>
      </div>

      {/* Main Content Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        {page.content.map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Official Business Entity: <strong>Vasavi Enterprises</strong></span>
          <Link href="/" className="text-blue-600 font-bold hover:underline">
            Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}

