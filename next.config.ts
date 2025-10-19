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

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    // Static assets: JS/CSS
    {
      urlPattern: /\.(?:js|css)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Images (remote + local)
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // API routes
    {
      urlPattern: /^\/api\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "api",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
        backgroundSync: {
          name: "api-queue",
          options: { maxRetentionTime: 60 },
        },
      },
    },
    // HTML/documents
    {
      urlPattern: /^\/.*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
  ],
})(nextConfig);
