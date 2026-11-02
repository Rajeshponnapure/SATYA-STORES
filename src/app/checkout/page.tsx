"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatINR } from "@/lib/utils";
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Building2,
  Smartphone,
  AlertTriangle,
  ArrowRight,
  UploadCloud,
  FileCheck2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, settings, createOrder, submitPaymentDetails, currentUser } =
    useStore();

  const [step, setStep] = useState<"address" | "payment" | "utr">("address");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Address Form State
  const [recipientName, setRecipientName] = useState(currentUser?.fullName || "");
  const [mobileNumber, setMobileNumber] = useState(currentUser?.mobileNumber || "");
  const [addressLine1, setAddressLine1] = useState("Flat 204, Royal Palms");
  const [addressLine2, setAddressLine2] = useState("MG Road");
  const [city, setCity] = useState("Vijayawada");
  const [state, setState] = useState("Andhra Pradesh");
  const [postalCode, setPostalCode] = useState("520002");

  // Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "BANK_TRANSFER">("UPI");

  // Created Order & UTR Submission State
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");

  const shippingCharge =
    cartTotal >= settings.freeShippingThreshold ? 0 : settings.standardShippingFee;
  const totalAmount = cartTotal + shippingCharge;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !mobileNumber || !addressLine1 || !city || !postalCode) {
      toast.error("Please fill in all mandatory delivery address fields.");
      return;
    }
    setStep("payment");
  };

  const handleConfirmAndProceedToPayment = () => {
    const order = createOrder({
      recipientName,
      mobileNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      paymentMethod,
    });

    if (order) {
      setCreatedOrderId(order.id);
      setCreatedOrderNumber(order.orderNumber);
      setStep("utr");
    }
  };

  const handleUtrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrderId) return;

    if (!utrNumber || utrNumber.trim().length < 6) {
      toast.error("Please enter a valid 12-digit UPI UTR or Bank Reference number.");
      return;
    }

    const success = submitPaymentDetails(
      createdOrderId,
      utrNumber,
      screenshotUrl || "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80"
    );

    if (success) {
      router.push(`/orders/${createdOrderId}`);
    }
  };

  if (cart.length === 0 && !createdOrderId) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
        <Link href="/" className="mt-4 inline-block text-sm text-blue-600 font-bold hover:underline">
          Return to Storefront
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Checkout Progress Stepper */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === "address"
                  ? "bg-blue-600 text-white"
                  : "bg-emerald-600 text-white"
              }`}
            >
              1
            </span>
            <span className="text-xs font-bold text-slate-900 hidden sm:inline">
              Delivery Address
            </span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === "payment"
                  ? "bg-blue-600 text-white"
                  : step === "utr"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              2
            </span>
            <span className="text-xs font-bold text-slate-900 hidden sm:inline">
              Transfer Funds
            </span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === "utr"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              3
            </span>
            <span className="text-xs font-bold text-slate-900 hidden sm:inline">
              Submit UTR Proof
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: DELIVERY ADDRESS */}
      {step === "address" && (
        <form onSubmit={handleAddressSubmit} className="space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">Delivery Information</h2>
              <p className="text-xs text-slate-500">
                Where should Vasavi Enterprises dispatch your electronics order?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Ramesh Sharma"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mobile Number (For Delivery SMS / Call) *
                </label>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">
                  Street Address / Flat No / Building *
                </label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Flat 402, Sai Balaji Residency"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Landmark / Locality (Optional)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Near RTC Complex"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  City / Town *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Vijayawada"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Andhra Pradesh"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. 520002"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-100">
              <Link
                href="/cart"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Back to Cart
              </Link>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                Continue to Payment Instructions <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: PAYMENT METHOD & TRANSFER INSTRUCTIONS */}
      {step === "payment" && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Direct Bank / UPI Transfer Instructions
              </h2>
              <p className="text-xs text-slate-500">
                Transfer the exact order amount directly to our business account.
              </p>
            </div>

            {/* Total Amount Payable Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-200 uppercase font-bold tracking-wider">
                  Total Amount to Transfer
                </span>
                <div className="text-3xl font-black text-white mt-0.5">
                  {formatINR(totalAmount)}
                </div>
              </div>
              <div className="text-right text-xs text-blue-200">
                <span>Inclusive of taxes</span>
                <div className="text-emerald-400 font-bold">Zero gateway fee</div>
              </div>
            </div>

            {/* Payment Method Switcher */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  paymentMethod === "UPI"
                    ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">UPI Instant Transfer</h4>
                  <p className="text-[10px] text-slate-500">GPay, PhonePe, Paytm, BHIM</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Direct Bank NEFT / IMPS</h4>
                  <p className="text-[10px] text-slate-500">Axis Bank Current Account</p>
                </div>
              </button>
            </div>

            {/* Transfer Details Card */}
            {paymentMethod === "UPI" ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Recipient Entity Name
                    </span>
                    <p className="font-bold text-sm text-slate-900">{settings.upiRecipientName}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Verified Merchant
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Official UPI ID
                    </span>
                    <p className="font-mono font-bold text-sm text-blue-700">{settings.upiId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.upiId, "UPI ID")}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors shadow-sm"
                    title="Copy UPI ID"
                  >
                    {copiedField === "UPI ID" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Open your UPI app (Google Pay, PhonePe, Paytm), select <strong>Pay via UPI ID</strong>, paste <code>{settings.upiId}</code>, and enter exact amount <strong>{formatINR(totalAmount)}</strong>. Note your 12-digit UTR reference.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Account Name</span>
                    <p className="font-bold text-slate-900 text-sm">{settings.bankAccountName}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Account Number</span>
                      <p className="font-mono font-bold text-slate-900 text-sm">{settings.bankAccountNumber}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(settings.bankAccountNumber, "Account Number")}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">IFSC Code</span>
                      <p className="font-mono font-bold text-slate-900 text-sm">{settings.bankIFSC}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(settings.bankIFSC, "IFSC Code")}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Bank & Branch</span>
                    <p className="font-bold text-slate-900 text-sm">{settings.bankName}, {settings.bankBranch}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Critical PRD Compliance Note */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Notice on Payment Verification</span>
              </div>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                Submitting payment reference reserves your stock immediately. Your order will be officially confirmed after the store owner checks and verifies the credit in the business bank statement.
              </p>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep("address")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Back to Address
              </button>
              <button
                type="button"
                onClick={handleConfirmAndProceedToPayment}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all active:scale-95"
              >
                I have transferred ₹{totalAmount.toLocaleString()} — Submit UTR <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SUBMIT UTR REFERENCE & EVIDENCE */}
      {step === "utr" && createdOrderId && (
        <form onSubmit={handleUtrSubmit} className="space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Order Created Successfully
                </span>
                <h2 className="text-lg font-black text-slate-900">
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

            <div className="space-y-4 text-xs">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-base font-bold text-slate-900 tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Found on your payment app receipt under &quot;UPI Transaction ID&quot; or &quot;UTR&quot;.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Payment Screenshot (Optional supporting evidence)
                </label>
                <input
                  type="url"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="Paste receipt image URL (or leave blank to use receipt proof)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
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
