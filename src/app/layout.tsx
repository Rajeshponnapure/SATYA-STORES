import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0F172A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#F4F6F9] text-slate-800 min-h-screen flex flex-col">
        <StoreProvider>
          <AnimatedGridBackground>
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-24 lg:pb-8">
              {children}
            </main>
            <Footer />
            <MobileBottomNav />
            <Toaster position="top-center" richColors closeButton />
          </AnimatedGridBackground>
        </StoreProvider>
      </body>
    </html>
  );
}
