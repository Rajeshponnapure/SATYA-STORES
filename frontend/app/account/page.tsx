"use client";

import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  User as UserIcon,
  MapPin,
  Package,
  Heart,
  LogOut,
  Edit2,
  Plus,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  X,
  CreditCard,
  RotateCcw,
  Clock,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ProfileImagePicker } from "@/components/profile/ProfileImagePicker";

export default function AccountPage() {
  const router = useRouter();
  const {
    currentUser,
    logoutCustomer,
    updateProfile,
    uploadImage,
    orders,
    favorites,
    settings,
    initiateRazorpayPayment,
  } = useStore();

  // Active Sub-tab for Mobile & Desktop
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "addresses" | "payments">(
    "overview"
  );

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.fullName || "");
  const [profileMobile, setProfileMobile] = useState(currentUser?.mobileNumber || "");

  // Address Edit State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressToEditId, setAddressToEditId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState(
    currentUser?.addresses?.[0]?.recipientName || currentUser?.fullName || ""
  );
  const [mobileNumber, setMobileNumber] = useState(
    currentUser?.addresses?.[0]?.mobileNumber || currentUser?.mobileNumber || ""
  );
  const [addressLine1, setAddressLine1] = useState(
    currentUser?.addresses?.[0]?.addressLine1 || ""
  );
  const [addressLine2, setAddressLine2] = useState(
    currentUser?.addresses?.[0]?.addressLine2 || ""
  );
  const [city, setCity] = useState(currentUser?.addresses?.[0]?.city || "Vijayawada");
  const [state, setState] = useState(currentUser?.addresses?.[0]?.state || "Andhra Pradesh");
  const [postalCode, setPostalCode] = useState(currentUser?.addresses?.[0]?.postalCode || "520010");

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-8 sm:my-16 px-3 text-center">
        <div className="p-6 sm:p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-4">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              Track electronics orders, view Razorpay receipts, manage delivery addresses, and sync your wishlist.
            </p>
          </div>
          <div className="space-y-2.5 pt-2">
            <Link
              href="/auth/login"
              className="block w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="block w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userOrders = orders.filter(
    (o) => o.userId === currentUser.id || o.customerEmail === currentUser.email
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    const success = await updateProfile({
      fullName: profileName.trim(),
      mobileNumber: profileMobile.trim(),
    });
    setIsEditingProfile(false);
    if (success) toast.success("Profile updated successfully!");
  };

  const handleOpenAddAddress = () => {
    setAddressToEditId(null);
    setRecipientName(currentUser.fullName || "");
    setMobileNumber(currentUser.mobileNumber || "");
    setAddressLine1("");
    setAddressLine2("");
    setCity("Vijayawada");
    setState("Andhra Pradesh");
    setPostalCode("520010");
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine1.trim() || !recipientName.trim() || !mobileNumber.trim()) {
      toast.error("Please fill in all required address fields.");
      return;
    }

    const currentAddresses = currentUser.addresses || [];
    let updatedAddresses = [...currentAddresses];

    const newAddr = {
      id: addressToEditId || `addr-${Date.now()}`,
      userId: currentUser.id,
      recipientName: recipientName.trim(),
      mobileNumber: mobileNumber.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      isDefault: currentAddresses.length === 0 ? true : false,
    };

    if (addressToEditId) {
      updatedAddresses = updatedAddresses.map((a) => (a.id === addressToEditId ? newAddr : a));
    } else {
      updatedAddresses.push(newAddr);
    }

    const success = await updateProfile({
      addresses: updatedAddresses,
    });
    setIsEditingAddress(false);
    if (success) toast.success("Address saved successfully!");
  };

  const handleSetDefaultAddress = async (addrId: string) => {
    if (!currentUser.addresses) return;
    const updated = currentUser.addresses.map((a) => ({
      ...a,
      isDefault: a.id === addrId,
    }));
    const success = await updateProfile({ addresses: updated });
    if (success) toast.success("Primary address updated!");
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "Verified":
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Verified
          </span>
        );
      case "Refunded":
        return (
          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200 inline-flex items-center gap-1">
            <RotateCcw className="h-3 w-3 text-purple-600" /> Refunded
          </span>
        );
      case "Partially Refunded":
        return (
          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200 inline-flex items-center gap-1">
            <RotateCcw className="h-3 w-3 text-purple-600" /> Part-Refunded
          </span>
        );
      case "Verification Pending":
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-blue-600" /> In Verification
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 inline-flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-rose-600" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-600" /> Awaiting
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-24 sm:pb-16 px-1 sm:px-4">
      {/* ========================================================= */}
      {/* 1. HERO USER PROFILE CARD */}
      {/* ========================================================= */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400" />

        <div className="flex items-start gap-3 sm:gap-4 pt-1">
          {/* Avatar with gradient */}
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shadow-blue-500/20 shrink-0 aspect-square ring-4 ring-blue-50/80">
            {currentUser.profileImage ? <Image src={currentUser.profileImage} alt="Your profile photo" fill sizes="64px" unoptimized className="object-cover" /> : (currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "U")}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate leading-tight">
                  {currentUser.fullName}
                </h1>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                  <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>Verified Customer</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold shrink-0 transition-colors flex items-center gap-1 active:scale-95"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                <span>{isEditingProfile ? "Cancel" : "Edit"}</span>
              </button>
            </div>

            {/* Email & Mobile */}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-slate-500 text-[11px] sm:text-xs">
                  {currentUser.email}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500 text-[11px] sm:text-xs font-mono">
                  {currentUser.mobileNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Edit Profile Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <ProfileImagePicker
              image={currentUser.profileImage}
              name={currentUser.fullName}
              onUpload={async (fileName, fileData) => {
                const uploaded = await uploadImage(fileName, fileData);
                if (!uploaded.success || !uploaded.url) return null;
                const saved = await updateProfile({ profileImage: uploaded.url });
                return saved ? uploaded.url : null;
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={profileMobile}
                  onChange={(e) => setProfileMobile(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Save Details
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. RESPONSIVE TAB CONTROLLER (Mobile horizontal pill bar) */}
      {/* ========================================================= */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex-1 min-w-[75px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex-1 min-w-[75px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center whitespace-nowrap ${
            activeTab === "orders"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Orders ({userOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("addresses")}
          className={`flex-1 min-w-[85px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center whitespace-nowrap ${
            activeTab === "addresses"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Addresses
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center whitespace-nowrap ${
            activeTab === "payments"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Payments & Refunds
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB CONTENT 1: OVERVIEW */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className="p-3 sm:p-4 rounded-2xl bg-white/95 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center hover:border-blue-400 active:scale-[0.98] transition-all group"
            >
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 mb-1 group-hover:scale-105 transition-transform">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {userOrders.length}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-slate-500">Orders</span>
            </button>

            <Link
              href="/favorites"
              className="p-3 sm:p-4 rounded-2xl bg-white/95 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center hover:border-rose-400 active:scale-[0.98] transition-all group"
            >
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 mb-1 group-hover:scale-105 transition-transform">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-rose-500/20" />
              </div>
              <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {favorites.length}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-slate-500">Wishlist</span>
            </Link>

            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className="p-3 sm:p-4 rounded-2xl bg-white/95 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center hover:border-amber-400 active:scale-[0.98] transition-all group"
            >
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 mb-1 group-hover:scale-105 transition-transform">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {currentUser.addresses?.length || 0}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-slate-500">Addresses</span>
            </button>
          </div>

          {/* Recent Order Snapshot */}
          {userOrders.length > 0 && (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Most Recent Order
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5"
                >
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {(() => {
                const latest = userOrders[0];
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900">
                          {latest.orderNumber}
                        </span>
                        <span className="text-slate-400 text-[11px] block">
                          {new Date(latest.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPaymentStatusBadge(latest.paymentStatus)}
                        <span className="font-black text-slate-900 text-sm">
                          {formatINR(latest.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Image width={640} height={640} unoptimized
                        src={latest.itemsSnapshot[0]?.image}
                        alt="item"
                        className="h-12 w-12 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1 shrink-0"
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <p className="font-bold text-slate-800 line-clamp-1">
                          {latest.itemsSnapshot[0]?.productName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {latest.itemsSnapshot.length > 1
                            ? `+ ${latest.itemsSnapshot.length - 1} other item(s)`
                            : `Qty: ${latest.itemsSnapshot[0]?.quantity}`}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Courier: {latest.deliveryStatus}
                      </span>
                      <Link
                        href={`/orders/${latest.id}`}
                        className="py-1.5 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        Track Order <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Quick Help & Support Bar */}
          <div className="bg-white/95 rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
              Vasavi Enterprises Support Desk
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Have questions regarding electronics specifications, Razorpay settlements, or urgent delivery dispatch?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${settings?.supportPhone || "+919849012345"}`}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
              >
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-900">Direct Helpline</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {settings?.supportPhone || "+91 98490 12345"}
                  </p>
                </div>
              </a>

              <a
                href={`https://wa.me/${(settings?.supportPhone || "+91 98490 12345").replace(/[^0-9]/g, "").replace(/^91(?=\d{10}$)/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100 flex items-center gap-2.5 transition-colors"
              >
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-emerald-900">WhatsApp Store Chat</p>
                  <p className="text-[11px] text-emerald-700">Instant customer assistant</p>
                </div>
              </a>
            </div>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={() => {
              logoutCustomer();
              router.push("/");
            }}
            className="w-full py-3 px-4 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB CONTENT 2: ORDERS LIST (Mobile optimized cards) */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-extrabold text-slate-900">
              Your Orders ({userOrders.length})
            </h2>
            <Link
              href="/orders"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Full Order Tracker →
            </Link>
          </div>

          {userOrders.length === 0 ? (
            <div className="p-8 text-center bg-white/95 rounded-3xl border border-slate-200 space-y-2">
              <Package className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">No orders placed yet</h3>
              <p className="text-xs text-slate-500">Your purchased items will appear here.</p>
              <Link
                href="/"
                className="mt-3 inline-block px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Browse Electronics
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-mono font-black text-xs text-slate-900">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPaymentStatusBadge(ord.paymentStatus)}
                      <span className="font-black text-slate-900 text-sm">
                        {formatINR(ord.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Items strip */}
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 shrink-0">
                      {ord.itemsSnapshot.slice(0, 3).map((it, idx) => (
                        <Image width={640} height={640} unoptimized
                          key={idx}
                          src={it.image}
                          alt={it.productName}
                          className="h-10 w-10 rounded-lg object-contain bg-slate-50 ring-2 ring-white border border-slate-200"
                        />
                      ))}
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-bold text-slate-800 line-clamp-1">
                        {ord.itemsSnapshot[0]?.productName}
                      </p>
                      <span className="text-[11px] text-slate-400 block">
                        {ord.itemsSnapshot.length > 1
                          ? `+ ${ord.itemsSnapshot.length - 1} more items`
                          : `Qty: ${ord.itemsSnapshot[0]?.quantity}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Razorpay pay button if pending */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Status: {ord.orderStatus}
                    </span>

                    <div className="flex items-center gap-2">
                      {ord.paymentStatus === "Awaiting Payment" && (
                        <button
                          type="button"
                          onClick={() => initiateRazorpayPayment(ord)}
                          className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Pay Now</span>
                        </button>
                      )}
                      <Link
                        href={`/orders/${ord.id}`}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1"
                      >
                        Track <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB CONTENT 3: ADDRESSES */}
      {/* ========================================================= */}
      {activeTab === "addresses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">
              Saved Delivery Addresses ({currentUser.addresses?.length || 0})
            </h2>
            {!isEditingAddress && (
              <button
                type="button"
                onClick={handleOpenAddAddress}
                className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Address</span>
              </button>
            )}
          </div>

          {/* Inline Edit / Add Address Form */}
          {isEditingAddress && (
            <form
              onSubmit={handleSaveAddress}
              className="bg-white/95 rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  {addressToEditId ? "Edit Delivery Address" : "Add New Delivery Address"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                    placeholder="10-digit number"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Street, Flat / Door No, Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Flat 402, Sai Residency"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Near City Center"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Vijayawada"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Andhra Pradesh"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-mono font-medium focus:ring-2 focus:ring-blue-500/20"
                      placeholder="520010"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* List of addresses */}
          {currentUser.addresses && currentUser.addresses.length > 0 ? (
            <div className="space-y-3">
              {currentUser.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-4 rounded-2xl bg-white/95 border transition-all space-y-2 ${
                    addr.isDefault
                      ? "border-blue-500/80 ring-2 ring-blue-500/10 shadow-sm"
                      : "border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {addr.recipientName}
                      </span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[11px] font-bold text-slate-500 hover:text-blue-600"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAddressToEditId(addr.id);
                          setRecipientName(addr.recipientName);
                          setMobileNumber(addr.mobileNumber);
                          setAddressLine1(addr.addressLine1);
                          setAddressLine2(addr.addressLine2 || "");
                          setCity(addr.city);
                          setState(addr.state);
                          setPostalCode(addr.postalCode);
                          setIsEditingAddress(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700"
                        title="Edit Address"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed">
                    {addr.addressLine1}
                    {addr.addressLine2 && `, ${addr.addressLine2}`}
                  </p>
                  <p className="text-slate-600 text-xs font-medium">
                    {addr.city}, {addr.state} — <span className="font-mono">{addr.postalCode}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <Phone className="h-3 w-3 text-slate-400" /> {addr.mobileNumber}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white/95 rounded-3xl border border-slate-200 space-y-2">
              <MapPin className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No delivery address saved yet.</p>
              <button
                type="button"
                onClick={handleOpenAddAddress}
                className="mt-2 inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Address
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB CONTENT 4: PAYMENTS & REFUNDS (RAZORPAY TRACKER) */}
      {/* ========================================================= */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900">
                Razorpay Payment Gateway & Refund Records
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transactions, instant UPI verifications, and processed refunds for your account.
            </p>

            {userOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No transactions recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {userOrders.map((ord) => (
                  <div key={ord.id} className="py-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {ord.razorpayPaymentId || ord.paymentReference || "N/A"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 block">
                          {formatINR(ord.totalAmount)}
                        </span>
                        {getPaymentStatusBadge(ord.paymentStatus)}
                      </div>
                    </div>

                    {/* Method & Settlement details */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span>Payment Gateway:</span>
                        <span className="font-bold text-slate-800">
                          {ord.paymentMethod === "RAZORPAY"
                            ? "Razorpay Secure Gateway"
                            : ord.paymentMethod}
                        </span>
                      </div>
                      {ord.refundAmount && ord.refundAmount > 0 && (
                        <div className="flex justify-between text-purple-700 font-bold">
                          <span>Razorpay Refund Amount:</span>
                          <span>{formatINR(ord.refundAmount)}</span>
                        </div>
                      )}
                      {ord.refundId && (
                        <div className="flex justify-between text-purple-700">
                          <span>Refund Reference:</span>
                          <span className="font-mono">{ord.refundId}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(ord.createdAt).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
