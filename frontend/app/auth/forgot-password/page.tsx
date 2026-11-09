"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const { requestPasswordReset, resetPasswordWithOtp } = useStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your registered email or mobile number.");
      return;
    }

    setIsLoading(true);
    const result = await requestPasswordReset(identifier);
    setIsLoading(false);

    if (result.success) {
      if (result.simulatedOtp) {
        setSimulatedOtpNotice(result.simulatedOtp);
        setOtp(result.simulatedOtp); // Auto-fill for friction-free verification
      }
      setStep(2);
    }
  };

  // Step 2: Submit Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    if (newPassword.length < 12) {
      toast.error("Password must be at least 12 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match. Please recheck.");
      return;
    }

    setIsLoading(true);
    const result = await resetPasswordWithOtp(identifier, otp, newPassword);
    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
      toast.success("Password reset successfully!");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-blue-600 text-white items-center justify-center mb-3 shadow-md shadow-blue-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Reset Your Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {step === 1
              ? "Enter your registered email or mobile number to receive a verification OTP."
              : "Enter the 6-digit code and choose your new secure password."}
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center shadow-inner">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Password Reset Complete!</h2>
              <p className="text-xs text-slate-600 mt-1">
                Your password has been securely updated and hashed with PBKDF2 encryption.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/25 hover:bg-blue-700 transition-all"
            >
              Sign In to Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        ) : step === 1 ? (
          /* Step 1: Input Identifier */
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email or Mobile Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="name@example.com or 9849012345"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all"
                />
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/25 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending Verification Code...
                </>
              ) : (
                <>
                  Send 6-Digit Code
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        ) : (
          /* Step 2: Verify OTP & Enter New Password */
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Simulated OTP Notification Banner */}
            {simulatedOtpNotice && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 shadow-sm">
                <Smartphone className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Simulated SMS/Email:</span> Your 6-digit verification code is{" "}
                  <span className="font-mono font-black text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded">
                    {simulatedOtpNotice}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={12}
                  placeholder="At least 12 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all"
                />
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all"
                />
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/25 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Confirm & Update Password
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Change Contact
              </button>
              <Link
                href="/auth/login"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
