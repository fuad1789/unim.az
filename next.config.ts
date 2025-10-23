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
    // Static assets: JS/CSS - Cache aggressively for offline use
    {
      urlPattern: /\.(?:js|css)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          purgeOnQuotaError: true,
        },
      },
    },
    // Images (remote + local) - Cache first for better offline experience
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          purgeOnQuotaError: true,
        },
      },
    },
    // Fonts - Cache aggressively
    {
      urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "fonts",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          purgeOnQuotaError: true,
        },
      },
    },
    // API routes - Network first with better offline handling
    {
      urlPattern: /^\/api\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "api",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          purgeOnQuotaError: true,
        },
        backgroundSync: {
          name: "api-queue",
          options: {
            maxRetentionTime: 24 * 60, // 24 hours
          },
        },
      },
    },
    // Data files (JSON) - Cache aggressively for offline use
    {
      urlPattern: /\.(?:json)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "data-files",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          purgeOnQuotaError: true,
        },
      },
    },
    // HTML/documents - Network first with offline fallback
    {
      urlPattern: /^\/.*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          purgeOnQuotaError: true,
        },
      },
    },
  ],
  // Additional PWA configuration for better offline support
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);
