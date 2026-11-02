import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { AnimatedGridBackground } from "@/components/layout/AnimatedGridBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Satya Stores | Vasavi Enterprises — Premium Electronics & Appliances",
  description:
    "Mobile-first e-commerce store for smartphones, laptops, 4K OLED TVs, kitchen appliances, and accessories with verified direct UPI & Bank transfer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#F4F6F9] text-slate-800">
        <StoreProvider>
          <AnimatedGridBackground>
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              {children}
            </main>
            <Footer />
            <MobileBottomNav />
            <Toaster position="top-right" richColors closeButton />
          </AnimatedGridBackground>
        </StoreProvider>
      </body>
    </html>
  );
}
