import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  ),
  title: {
    default: "ズボラクめし | 冷蔵庫をパシャっと撮るだけ献立提案AI",
    template: "%s | ズボラクめし",
  },
  description: "冷蔵庫をパシャっと撮るだけで、爆速で今夜の献立を決める。ズボラのための最強キッチンツール（献立提案AI）。買い出し不要、洗い物少なめレシピをご提案。",
  keywords: ["献立", "レシピ", "AI", "冷蔵庫", "ズボラ", "時短料理", "洗い物少なめ", "パシャめし", "ズボラクめし"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ズボラクめし",
    description: "冷蔵庫を撮るだけで爆速で今日のご飯が決まる。ズボラのための献立AI。",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ズボラクめし",
    description: "冷蔵庫を撮るだけで爆速で今日のご飯が決まる。ズボラのための献立AI。",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col touch-manipulation overscroll-y-none">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
