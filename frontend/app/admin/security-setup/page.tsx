"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface TotpSetup {
  secret: string;
  qrCodeDataUrl: string;
  expiresAt: string;
}

export default function AdminSecuritySetupPage() {
  const [setupKey, setSetupKey] = useState("");
  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const secureRequest = async (path: string, body?: Record<string, string>) => {
    const response = await fetch(`/api/admin/security-bootstrap/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Security-Setup-Key": setupKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const requireSetupKey = () => {
    if (setupKey.length < 32) {
      toast.error("Enter the 32+ character setup key stored only in Render.");
      return false;
    }
    return true;
  };

  const generateAuthenticator = async () => {
    if (!requireSetupKey()) return;
    setIsWorking(true);
    try {
      const { response, data } = await secureRequest("generate-totp");
      if (!response.ok || !data.success) {
        toast.error(data.error || "Could not generate the authenticator QR code.");
        return;
      }
      setTotpSetup(data as TotpSetup);
      setTotpCode("");
      toast.success("Scan the QR code in Google Authenticator.");
    } catch {
      toast.error("Could not reach the security setup service.");
    } finally {
      setIsWorking(false);
    }
  };

  const confirmAuthenticator = async (event: FormEvent) => {
    event.preventDefault();
    if (!requireSetupKey() || !/^\d{6}$/.test(totpCode)) {
      if (/^\d{6}$/.test(totpCode) === false) toast.error("Enter the current six-digit code from the QR you scanned.");
      return;
    }
    setIsWorking(true);
    try {
      const { response, data } = await secureRequest("confirm-totp", { code: totpCode });
      if (!response.ok || !data.success) {
        toast.error(data.error || "The authenticator code was not accepted.");
        return;
      }
      setTotpSetup(null);
      setTotpCode("");
      toast.success("The shared Google Authenticator is now active.");
    } catch {
      toast.error("Could not confirm the authenticator.");
    } finally {
      setIsWorking(false);
    }
  };

  const setSharedPin = async (event: FormEvent) => {
    event.preventDefault();
    if (!requireSetupKey()) return;
    if (!/^\d{6}$/.test(pin)) {
      toast.error("The Admin PIN must be exactly six digits.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("The two PIN entries do not match.");
      return;
    }
    setIsWorking(true);
    try {
      const { response, data } = await secureRequest("set-pin", { pin });
      if (!response.ok || !data.success) {
        toast.error(data.error || "Could not save the shared Admin PIN.");
        return;
      }
      setPin("");
      setConfirmPin("");
      toast.success("The shared six-digit Admin PIN is now active.");
    } catch {
      toast.error("Could not save the Admin PIN.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <main className="min-h-[85vh] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-amber-400">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Super-admin security setup</h1>
          <p className="mt-2 text-sm text-slate-600">This page provisions the one shared authenticator and shared Admin PIN before anyone signs in.</p>
        </div>

        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
          <strong>Only the main admin should use this page.</strong> Its address is not the security control—the private setup key in Render is. Do not share that key, the QR code, or the PIN. When setup is finished, remove the setup key from Render to disable this page&apos;s actions.
        </div>

        <label className="mb-4 block text-xs font-bold text-slate-700">
          Render super-admin setup key
          <input
            type="password"
            autoComplete="off"
            value={setupKey}
            onChange={(event) => setSetupKey(event.target.value)}
            placeholder="32+ character ADMIN_SECURITY_SETUP_KEY"
            className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </label>

        <section className="space-y-3 border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900">1. Register the shared authenticator</h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">Generate a QR code, scan it only on the main administrator&apos;s Google Authenticator, then confirm one current code. Generating another QR replaces the pending setup but not a confirmed authenticator.</p>
          {!totpSetup ? (
            <button type="button" onClick={() => void generateAuthenticator()} disabled={isWorking} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-amber-400 disabled:opacity-50">
              {isWorking ? "Generating…" : "Generate one-time QR code"}
            </button>
          ) : (
            <form onSubmit={confirmAuthenticator} className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <Image src={totpSetup.qrCodeDataUrl} alt="Google Authenticator setup QR code" width={208} height={208} unoptimized className="mx-auto h-52 w-52 rounded-lg bg-white p-1" />
              <details className="text-xs text-emerald-950"><summary className="cursor-pointer font-bold">Cannot scan this QR code?</summary><p className="mt-2 break-all font-mono select-all">{totpSetup.secret}</p></details>
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ""))} placeholder="Current six-digit code" className="w-full rounded-xl border border-emerald-300 bg-white p-3 text-center font-mono font-bold tracking-[0.3em]" />
              <button type="submit" disabled={isWorking} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isWorking ? "Confirming…" : "Confirm shared authenticator"}</button>
            </form>
          )}
        </section>

        <form onSubmit={setSharedPin} className="mt-6 space-y-3 border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-700" />
            <h2 className="font-bold text-slate-900">2. Set the shared six-digit Admin PIN</h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">This value is securely hashed. Regular admins can verify it while signing in, but cannot view or change it.</p>
          <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} required value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} placeholder="Six-digit Admin PIN" className="w-full rounded-xl border border-slate-200 p-3 text-center font-mono font-bold tracking-[0.3em]" />
          <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} required value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, ""))} placeholder="Confirm six-digit Admin PIN" className="w-full rounded-xl border border-slate-200 p-3 text-center font-mono font-bold tracking-[0.3em]" />
          <button type="submit" disabled={isWorking} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-amber-400 disabled:opacity-50">{isWorking ? "Saving…" : "Set shared Admin PIN"}</button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500"><Lock className="h-3.5 w-3.5" /> Normal login has no setup option.</span>
          <Link href="/admin" className="font-bold text-blue-700 hover:text-blue-900">Go to admin login</Link>
        </div>
      </div>
    </main>
  );
}
