import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    domains: [
      "images.unsplash.com",
      "res.cloudinary.com",
      "via.placeholder.com",
    ],
  },
};

export default nextConfig;
