"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  Copy,
  Check,
  Building2,
  Smartphone,
  ArrowRight,
  FileCheck2,
  CreditCard,
  Zap,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    cartTotal,
    settings,
    createOrder,
    submitPaymentDetails,
    initiateRazorpayPayment,
    currentUser,
    discountAmount,
    isLoadingBackend,
  } = useStore();

  const [step, setStep] = useState<"address" | "payment" | "utr">("address");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);

  // Address Form State (Auto-filled from logged-in customer profile if available)
  const defaultAddr = currentUser?.addresses?.[0];
  const [recipientName, setRecipientName] = useState(
    defaultAddr?.recipientName || currentUser?.fullName || ""
  );
  const [mobileNumber, setMobileNumber] = useState(
    defaultAddr?.mobileNumber || currentUser?.mobileNumber || ""
  );
  const [addressLine1, setAddressLine1] = useState(
    defaultAddr?.addressLine1 || "Flat 204, Royal Palms"
  );
  const [addressLine2, setAddressLine2] = useState(defaultAddr?.addressLine2 || "MG Road");
  const [city, setCity] = useState(defaultAddr?.city || "Vijayawada");
  const [state, setState] = useState(defaultAddr?.state || "Andhra Pradesh");
  const [postalCode, setPostalCode] = useState(defaultAddr?.postalCode || "520002");

  // Payment Selection State - Razorpay is default & recommended
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "UPI" | "BANK_TRANSFER">(
    "RAZORPAY"
  );

  // Created Order & UTR Submission State
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");

  const shippingCharge =
    cartTotal >= settings.freeShippingThreshold ? 0 : settings.standardShippingFee;
  const totalAmount = Math.max(0, cartTotal - discountAmount + shippingCharge);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !mobileNumber.trim() || !addressLine1.trim() || !city.trim() || !postalCode.trim()) {
      toast.error("Please fill in all mandatory delivery address fields.");
      return;
    }
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Pay with Razorpay flow
  const handleRazorpayPayment = async () => {
    try {
      setIsProcessingRazorpay(true);
      const order = await createOrder({
        recipientName: recipientName.trim(),
        mobileNumber: mobileNumber.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        paymentMethod: "RAZORPAY",
      });

      if (!order) {
        setIsProcessingRazorpay(false);
        return;
      }

      setCreatedOrderId(order.id);
      setCreatedOrderNumber(order.orderNumber);

      const result = await initiateRazorpayPayment(order);
      setIsProcessingRazorpay(false);

      if (result.success) {
        router.push(`/orders/${order.id}`);
      } else {
        // If payment modal was cancelled or failed, stay on payment screen with order ready
        toast.info("You can retry payment with Razorpay or submit manual UPI reference.");
      }
    } catch (err: unknown) {
      setIsProcessingRazorpay(false);
      toast.error(err instanceof Error ? err.message : "Failed to proceed with Razorpay");
    }
  };

  // Manual UPI / Bank Transfer confirmation flow
  const handleManualProceed = async () => {
    const order = await createOrder({
      recipientName: recipientName.trim(),
      mobileNumber: mobileNumber.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      paymentMethod,
    });

    if (order) {
      setCreatedOrderId(order.id);
      setCreatedOrderNumber(order.orderNumber);
      setStep("utr");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrderId) return;

    if (!utrNumber || utrNumber.trim().length < 6) {
      toast.error("Please enter a valid 12-digit UPI UTR or Bank Reference number.");
      return;
    }

    const success = await submitPaymentDetails(
      createdOrderId,
      utrNumber,
      screenshotUrl || "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80"
    );

    if (success) {
      router.push(`/orders/${createdOrderId}`);
    }
  };

  if (cart.length === 0 && !createdOrderId && isLoadingBackend) {
    return (
      <div role="status" aria-live="polite" className="py-16 text-center text-sm font-semibold text-slate-500">
        Loading your cart…
      </div>
    );
  }

  if (cart.length === 0 && !createdOrderId) {
    return (
      <div className="py-16 sm:py-24 text-center px-4 max-w-md mx-auto">
        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-8 w-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800">Your cart is empty</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6">
          Add some electronics or home appliances to proceed to checkout.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs sm:text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Storefront
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-20 sm:pb-12 px-1">
      {/* Checkout Progress Stepper (Touch-optimized) */}
      <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between max-w-md mx-auto px-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black transition-colors ${
                step === "address"
                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-100"
                  : "bg-emerald-600 text-white"
              }`}
            >
              1
            </span>
            <span
              className={`text-[11px] sm:text-xs font-bold ${
                step === "address" ? "text-blue-600" : "text-slate-700"
              }`}
            >
              Address
            </span>
          </div>
          <div
            className={`h-0.5 flex-1 mx-2 transition-colors ${
              step !== "address" ? "bg-emerald-500" : "bg-slate-200"
            }`}
          />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black transition-colors ${
                step === "payment"
                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-100"
                  : step === "utr"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              2
            </span>
            <span
              className={`text-[11px] sm:text-xs font-bold ${
                step === "payment" ? "text-blue-600" : "text-slate-700"
              }`}
            >
              Payment
            </span>
          </div>
          <div
            className={`h-0.5 flex-1 mx-2 transition-colors ${
              step === "utr" ? "bg-emerald-500" : "bg-slate-200"
            }`}
          />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black transition-colors ${
                step === "utr"
                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-100"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              3
            </span>
            <span
              className={`text-[11px] sm:text-xs font-bold ${
                step === "utr" ? "text-blue-600" : "text-slate-400"
              }`}
            >
              Confirmation
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: DELIVERY ADDRESS */}
      {step === "address" && (
        <form onSubmit={handleAddressSubmit} className="space-y-4 sm:space-y-6">
          <div className="glass-card rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-sm space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">Delivery Information</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Enter your address for direct courier dispatch by Vasavi Enterprises
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                Step 1 of 2
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Ramesh Sharma"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                  Mobile Number (SMS / Call) *
                </label>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                  Street Address / Flat No / Building *
                </label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Flat 402, Sai Balaji Residency, Bandar Road"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                  Landmark / Locality (Optional)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Near Benz Circle / Opposite HP Petrol Pump"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                  City / Town *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Vijayawada"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Andhra Pradesh"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="520002"
                  />
                </div>
              </div>
            </div>

            {/* Price Preview Strip */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Order Total Payable:</span>
              <span className="text-base sm:text-lg font-black text-slate-900">
                {formatINR(totalAmount)}
              </span>
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
              <Link
                href="/cart"
                className="w-full sm:w-auto text-center py-2 text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                ← Back to Cart
              </Link>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                Proceed to Payment <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: PAYMENT METHOD & RAZORPAY / MANUAL FLOW */}
      {step === "payment" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="glass-card rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-sm space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Select Payment Gateway
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Official payment processing powered by Razorpay
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Lock className="h-3 w-3" /> 256-Bit SSL
              </span>
            </div>

            {/* Total Amount Payable Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] sm:text-xs text-blue-200 uppercase font-bold tracking-wider">
                  Total Amount to Pay
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  {formatINR(totalAmount)}
                </div>
                <span className="text-[10px] text-blue-300">
                  {cart.length} item{cart.length > 1 ? "s" : ""} • Free Express Shipping
                </span>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  Zero Surcharge
                </span>
              </div>
            </div>

            {/* Payment Method Options */}
            <div className="space-y-3">
              {/* Option 1: Razorpay (Recommended) */}
              <button
                type="button"
                onClick={() => setPaymentMethod("RAZORPAY")}
                className={`w-full p-4 rounded-2xl border text-left transition-all relative ${
                  paymentMethod === "RAZORPAY"
                    ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Zap className="h-5 w-5 fill-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        Razorpay Payment Gateway
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider">
                        Recommended • Instant
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Pay via Google Pay, PhonePe, Paytm, BHIM UPI, Credit/Debit Cards, NetBanking, or Wallets.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                        UPI Instant
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                        Visa / Mastercard / RuPay
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                        NetBanking
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 2: Direct UPI Manual Transfer */}
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  paymentMethod === "UPI"
                    ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      Direct UPI Transfer (UTR Verification)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pay directly to merchant UPI ID <code className="text-blue-600">{settings.upiId}</code> and submit UTR reference.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 3: Direct Bank NEFT/RTGS */}
              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      Direct Bank NEFT / IMPS (Axis Bank)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Transfer to Vasavi Enterprises Current A/C: {settings.bankAccountNumber}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Manual UPI details if chosen */}
            {paymentMethod === "UPI" && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Merchant UPI ID</span>
                    <p className="font-mono font-bold text-sm text-blue-700">{settings.upiId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.upiId, "UPI ID")}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600"
                  >
                    {copiedField === "UPI ID" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Recipient Name: <strong>{settings.upiRecipientName}</strong>
                </p>
              </div>
            )}

            {/* Manual Bank details if chosen */}
            {paymentMethod === "BANK_TRANSFER" && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Account</span>
                    <p className="font-mono font-bold text-slate-900">{settings.bankAccountNumber}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">IFSC</span>
                    <p className="font-mono font-bold text-slate-900">{settings.bankIFSC}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("address")}
                className="w-full sm:w-auto text-center py-2 text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                ← Back to Address
              </button>

              {paymentMethod === "RAZORPAY" ? (
                <button
                  type="button"
                  disabled={isProcessingRazorpay}
                  onClick={handleRazorpayPayment}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                >
                  <Zap className="h-4 w-4 fill-white" />
                  {isProcessingRazorpay
                    ? "Opening Razorpay..."
                    : `Pay ${formatINR(totalAmount)} via Razorpay`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleManualProceed}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  I Have Transferred — Enter UTR <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SUBMIT UTR REFERENCE (FOR MANUAL TRANSFERS) */}
      {step === "utr" && createdOrderId && (
        <form onSubmit={handleUtrSubmit} className="space-y-4 sm:space-y-6">
          <div className="glass-card rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-sm space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Order Reserved
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Submit Payment Reference (UTR)
                </h2>
              </div>
              <span className="font-mono font-bold text-xs bg-slate-100 px-3 py-1 rounded-lg text-slate-800">
                {createdOrderNumber}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Please enter your 12-digit transaction reference number (UTR) from your Google Pay, PhonePe, Paytm, or Net Banking receipt.
            </p>

            <div className="space-y-3 sm:space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  12-Digit UTR / Transaction Reference Number *
                </label>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 431289182901"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 font-mono text-base font-bold text-slate-900 tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Found on your payment app receipt under &quot;UPI Transaction ID&quot; or &quot;UTR&quot;.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Payment Screenshot (Optional supporting evidence URL)
                </label>
                <input
                  type="url"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="Paste receipt image URL (optional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <FileCheck2 className="h-4 w-4" /> Submit for Store Owner Verification
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
