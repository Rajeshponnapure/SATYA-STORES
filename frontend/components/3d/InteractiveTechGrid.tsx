"use client";

import React, { useEffect, useRef } from "react";

export function InteractiveTechGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates (default off-screen until moved)
    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, radius: 220 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Floating Cyber Motes / Particles
    const particleCount = Math.min(40, Math.floor(width / 32));
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      pulseSpeed: number;
      color: string;
    }> = [];

    const colors = [
      "rgba(37, 99, 235, ",   // Cobalt Blue
      "rgba(79, 70, 229, ",   // Indigo
      "rgba(14, 165, 233, ",  // Sky Blue
      "rgba(249, 115, 22, ",  // Warm Saffron
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 2 + 1.2,
        alpha: Math.random() * 0.35 + 0.1,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const gridSize = 44; // Tech grid spacing
    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Subtle Tech Grid Lines
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < width; x += gridSize) {
        const distFromMouse = Math.abs(x - mouse.x);
        let opacity = 0.032;

        if (distFromMouse < mouse.radius) {
          const intensity = 1 - distFromMouse / mouse.radius;
          opacity += intensity * 0.12;
        }

        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < height; y += gridSize) {
        const distFromMouse = Math.abs(y - mouse.y);
        let opacity = 0.032;

        if (distFromMouse < mouse.radius) {
          const intensity = 1 - distFromMouse / mouse.radius;
          opacity += intensity * 0.12;
        }

        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Tech Crosshair Dots at Grid Intersections near mouse
      const step = gridSize * 2;
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius * 1.2) {
            const intensity = Math.max(0, 1 - dist / (mouse.radius * 1.2));
            ctx.fillStyle = `rgba(37, 99, 235, ${intensity * 0.25})`;
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 3. React-Bits Ambient Cursor Spotlight Glow
      if (mouse.x > 0 && mouse.y > 0) {
        const radialGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius
        );
        radialGrad.addColorStop(0, "rgba(37, 99, 235, 0.07)");
        radialGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.03)");
        radialGrad.addColorStop(1, "rgba(244, 246, 249, 0)");

        ctx.fillStyle = radialGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Floating Cyber Particles & Connective Filaments
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Pulse alpha
        const currentAlpha = p.alpha + Math.sin(time + i) * 0.08;

        ctx.fillStyle = `${p.color}${Math.max(0.05, currentAlpha)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles with subtle filament lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.05 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ opacity: 0.95 }}
    />
  );
}
