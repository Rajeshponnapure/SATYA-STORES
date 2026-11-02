import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F6F9",
        brand: {
          navy: "#0F172A",
          cobalt: "#2563EB",
          saffron: "#FF6B00",
          amber: "#F59E0B",
          emerald: "#10B981",
          rose: "#EF4444",
          slate: "#334155",
          muted: "#64748B",
        },
      },
      animation: {
        "grid-drift": "gridDrift 20s ease-in-out infinite alternate",
        "pulse-subtle": "pulseSubtle 6s ease-in-out infinite",
        "cart-bump": "cartBump 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      keyframes: {
        gridDrift: {
          "0%": { transform: "translate(0px, 0px)" },
          "100%": { transform: "translate(18px, 18px)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        cartBump: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.25)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
