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
    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, radius: 180 };

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

    // Floating Cyber Energy Particles
    const particleCount = Math.min(35, Math.floor(width / 35));
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      pulseSpeed: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.4 + 0.1,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    const gridSize = 42; // Texture grid spacing
    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Textured Tech Grid Lines
      ctx.lineWidth = 1;
      const startX = 0;
      const startY = 0;

      // Vertical lines
      for (let x = startX; x < width; x += gridSize) {
        const distFromMouse = Math.abs(x - mouse.x);
        let opacity = 0.035;

        // Reactive glow near cursor
        if (distFromMouse < mouse.radius) {
          const intensity = 1 - distFromMouse / mouse.radius;
          opacity += intensity * 0.14;
        }

        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = startY; y < height; y += gridSize) {
        const distFromMouse = Math.abs(y - mouse.y);
        let opacity = 0.035;

        if (distFromMouse < mouse.radius) {
          const intensity = 1 - distFromMouse / mouse.radius;
          opacity += intensity * 0.14;
        }

        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Subtle Micro Intersections (Grid Dots)
      for (let x = startX; x < width; x += gridSize * 2) {
        for (let y = startY; y < height; y += gridSize * 2) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const factor = 1 - dist / mouse.radius;
            ctx.fillStyle = `rgba(37, 99, 235, ${factor * 0.35})`;
            ctx.beginPath();
            ctx.arc(x, y, 1.8 + factor * 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = `rgba(148, 163, 184, 0.18)`;
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 3. Render Floating Cyber Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(time * 2 + i));

        ctx.fillStyle = `rgba(59, 130, 246, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Ambient Radial Spotlight following Cursor
      if (mouse.x > 0 && mouse.y > 0) {
        const gradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius * 1.2
        );
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.08)");
        gradient.addColorStop(0.5, "rgba(99, 102, 241, 0.03)");
        gradient.addColorStop(1, "rgba(244, 246, 249, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius * 1.2, 0, Math.PI * 2);
        ctx.fill();
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
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-90"
      aria-hidden="true"
    />
  );
}
