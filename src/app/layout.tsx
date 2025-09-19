import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "unim.az",
  description: "Azerbaijan university week type checker",
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
      </body>
    </html>
  );
}
