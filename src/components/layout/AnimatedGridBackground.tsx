"use client";

import React from "react";

export function AnimatedGridBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#F4F6F9] text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* Eye-Comfort Ambient Lighting Glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Soft Radial Ambient Blue Orb (Top Left) */}
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-blue-400/[0.045] blur-[100px] animate-pulse-subtle" />
        
        {/* Soft Radial Ambient Warm Amber Orb (Bottom Right) */}
        <div className="absolute -bottom-[20%] -right-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-orange-400/[0.035] blur-[100px] animate-pulse-subtle" />
        
        {/* Subtle Central Violet Radiance */}
        <div className="absolute top-[35%] left-[30%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-indigo-300/[0.03] blur-[120px]" />
      </div>

      {/* SVG Animated Tech Grid Lines */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden opacity-70"
        aria-hidden="true"
      >
        <svg
          className="absolute inset-0 h-full w-full stroke-indigo-900/[0.055] [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_90%)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="satya-tech-grid"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
              patternTransform="translate(0, 0)"
            >
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                strokeWidth="1"
                strokeDasharray="none"
              />
              <circle cx="36" cy="36" r="1" className="fill-indigo-400/20" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#satya-tech-grid)" />
        </svg>
      </div>

      {/* Primary Content Container */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
}

