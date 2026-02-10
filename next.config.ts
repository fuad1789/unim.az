import type { NextConfig } from "next";
// TypeScript doesn't ship types for next-pwa; rely on local ambient declaration
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

const config = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // ... (rest of config)
})(nextConfig);

// Temporarily disable PWA due to build error "a[d] is not a function"
// export default config;
export default nextConfig;
