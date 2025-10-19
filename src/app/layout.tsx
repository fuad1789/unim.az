import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAInstallClient from "./pwa-install-client";
import RegisterSW from "./register-sw";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "unim.az",
  description: "Azerbaijan university week type checker",
  applicationName: "unim.az",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  icons: [
    {
      rel: "icon",
      url: "/icons/icon-192.svg",
      sizes: "192x192",
      type: "image/svg+xml",
    },
    {
      rel: "icon",
      url: "/icons/icon-512.svg",
      sizes: "512x512",
      type: "image/svg+xml",
    },
    { rel: "apple-touch-icon", url: "/icons/icon-192.svg" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "unim.az",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className="h-full bg-gray-50">
      <body
        className={`${inter.variable} font-sans text-gray-800 antialiased min-h-dvh`}
      >
        {children}
        <RegisterSW />
        <PWAInstallClient />
      </body>
    </html>
  );
}
