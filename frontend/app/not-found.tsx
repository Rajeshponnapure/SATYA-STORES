import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        <Store className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">404 - Page Not Found</h1>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-2 mb-6">
        The electronics product, category, or order page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
      >
        <ArrowLeft className="h-4 w-4" /> Return to Storefront
      </Link>
    </div>
  );
}

