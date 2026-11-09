/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  // Separate development output so production builds cannot replace chunks
  // while the development server is serving the app.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  outputFileTracingRoot: path.resolve(__dirname),
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "images.unsplash.com",
      "res.cloudinary.com",
      "via.placeholder.com",
    ],
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ...(process.env.VERCEL ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : [])
      ]
    }];
  },
  async rewrites() {
    const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const backendUrl = rawBackendUrl ? rawBackendUrl.replace(/\/+$/, "") : null;

    if (backendUrl) {
      return [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: "/uploads/:path*",
          destination: `${backendUrl}/uploads/:path*`,
        },
      ];
    }
    // On Vercel without a backend URL configured there is no backend to proxy
    // to, so /api 404s quickly instead of quietly failing against localhost.
    if (process.env.VERCEL) return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:5000/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://127.0.0.1:5000/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
