"use client";

import React from "react";
import { InteractiveTechGrid } from "@/components/3d/InteractiveTechGrid";

export function AnimatedGridBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#F4F6F9] text-slate-800 antialiased selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* 1. Interactive 3D / Texture Grid Canvas with Mouse Spotlight & Particles */}
      <InteractiveTechGrid />

      {/* 2. Soft Ambient Lighting Gradients */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Soft Radial Ambient Blue Orb (Top Left) */}
        <div className="absolute -top-[15%] -left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-blue-500/[0.04] blur-[120px] animate-pulse-subtle" />

        {/* Soft Radial Ambient Saffron Glow (Bottom Right) */}
        <div className="absolute -bottom-[15%] -right-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-orange-400/[0.035] blur-[120px] animate-pulse-subtle" />
      </div>

      {/* 3. Primary Content Container */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
}
