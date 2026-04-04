import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "パシャめし",
  description: "冷蔵庫をパシャっと撮るだけで、今ある食材と調味料で作れるレシピを提案。買い出し不要。",
  openGraph: {
    title: "パシャめし",
    description: "冷蔵庫を撮るだけで今日のご飯が決まる",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "パシャめし",
    description: "冷蔵庫を撮るだけで今日のご飯が決まる",
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
      <body className="min-h-full flex flex-col touch-manipulation overscroll-y-none">{children}</body>
    </html>
  );
}
