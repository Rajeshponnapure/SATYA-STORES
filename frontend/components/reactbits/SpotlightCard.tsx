"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  borderColor?: string;
  enableTilt?: boolean;
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(37, 99, 235, 0.15)",
  borderColor = "rgba(37, 99, 235, 0.35)",
  enableTilt = true,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for smooth cursor tracking
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);

  // 3D Tilt rotations
  const rotateX = useSpring(0, { stiffness: 300, damping: 25 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseX.set(x);
    mouseY.set(y);

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rX = ((y - centerY) / centerY) * -6; // max 6 deg tilt
      const rY = ((x - centerX) / centerX) * 6;
      rotateX.set(rX);
      rotateY.set(rY);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(-500);
    mouseY.set(-500);
    rotateX.set(0);
    rotateY.set(0);
  };

  const background = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 80%)`;
  const borderBackground = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, ${borderColor}, rgba(226, 232, 240, 0.8) 70%)`;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: "easeOut" } }}
      className={`relative rounded-3xl p-[1px] transition-shadow duration-300 ${
        isHovered ? "shadow-xl shadow-blue-500/10" : "shadow-sm shadow-slate-200/50"
      } ${className}`}
      {...(props as any)}
    >
      {/* Dynamic Animated Border Layer */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
        style={{
          background: borderBackground,
          opacity: isHovered ? 1 : 0.6,
        }}
      />

      {/* Internal Content Container with Ambient Spotlight */}
      <div className="relative h-full w-full rounded-[23px] bg-white/95 backdrop-blur-md overflow-hidden flex flex-col justify-between">
        {/* Spotlight illumination wash */}
        <motion.div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background,
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

