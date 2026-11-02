"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import {
  User,
  MapPin,
  Package,
  Heart,
  LogOut,
  Edit2,
  Check,
  Plus,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export default function AccountPage() {
  const router = useRouter();
  const { currentUser, logoutCustomer, updateProfile, orders, favorites } = useStore();

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [recipientName, setRecipientName] = useState(
    currentUser?.addresses?.[0]?.recipientName || currentUser?.fullName || ""
  );
  const [mobileNumber, setMobileNumber] = useState(
    currentUser?.addresses?.[0]?.mobileNumber || currentUser?.mobileNumber || ""
  );
  const [addressLine1, setAddressLine1] = useState(
    currentUser?.addresses?.[0]?.addressLine1 || ""
  );
  const [city, setCity] = useState(currentUser?.addresses?.[0]?.city || "Vijayawada");
  const [state, setState] = useState(currentUser?.addresses?.[0]?.state || "Andhra Pradesh");
  const [postalCode, setPostalCode] = useState(currentUser?.addresses?.[0]?.postalCode || "520010");

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center">
        <div className="p-8 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200 shadow-xl">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to your Account</h2>
          <p className="text-xs text-slate-500 mb-6">
            Sign in to view your orders, saved addresses, and manage your profile.
          </p>
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/20"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="block w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userOrders = orders.filter(
    (o) => o.userId === currentUser.id || o.customerEmail === currentUser.email
  );

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedAddress = {
      id: currentUser.addresses?.[0]?.id || `addr-${Date.now()}`,
      userId: currentUser.id,
      recipientName,
      mobileNumber,
      addressLine1,
      city,
      state,
      postalCode,
      isDefault: true,
    };

    await updateProfile({
      addresses: [updatedAddress],
    });
    setIsEditingAddress(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 pb-24">
      {/* Profile Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-blue-500/20">
            {currentUser.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{currentUser.fullName}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center space-x-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{currentUser.email}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{currentUser.mobileNumber}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            logoutCustomer();
            router.push("/");
          }}
          className="inline-flex items-center space-x-2 py-2 px-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Grid: Saved Address & Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Saved Shipping Address */}
        <div className="md:col-span-2 bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-base">Default Shipping Address</h2>
            </div>
            {!isEditingAddress && (
              <button
                onClick={() => setIsEditingAddress(true)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>{currentUser.addresses?.[0] ? "Edit" : "Add Address"}</span>
              </button>
            )}
          </div>

          {isEditingAddress ? (
            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Address Line / Street</label>
                <input
                  type="text"
                  required
                  placeholder="Flat/House no, Street name, Locality"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Pincode</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-sm"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : currentUser.addresses?.[0] ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-900 text-sm">
                {currentUser.addresses[0].recipientName}
              </p>
              <p className="text-slate-600">{currentUser.addresses[0].addressLine1}</p>
              <p className="text-slate-600">
                {currentUser.addresses[0].city}, {currentUser.addresses[0].state} -{" "}
                {currentUser.addresses[0].postalCode}
              </p>
              <p className="text-slate-500 pt-1 flex items-center space-x-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{currentUser.addresses[0].mobileNumber}</span>
              </p>
            </div>
          ) : (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-xs text-slate-500 mb-3">No shipping address saved yet.</p>
              <button
                onClick={() => setIsEditingAddress(true)}
                className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-blue-50 text-blue-600 font-semibold text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Add Delivery Address</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Fast Navigation Cards */}
        <div className="space-y-4">
          {/* Wishlist Card */}
          <Link
            href="/favorites"
            className="block p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm hover:border-rose-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="h-5 w-5 fill-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">My Wishlist</h3>
                  <p className="text-[11px] text-slate-500">{favorites.length} saved items</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600" />
            </div>
          </Link>

          {/* Orders Card */}
          <Link
            href="/orders"
            className="block p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">My Orders</h3>
                  <p className="text-[11px] text-slate-500">{userOrders.length} placed orders</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

