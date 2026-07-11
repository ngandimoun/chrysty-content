import type { Metadata } from "next";
import { Geist, Geist_Mono, Literata } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chrysty — Your Creative Library",
  description:
    "Create, organize, and continue your stories, podcasts, speeches, and more.",
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <body
        className={`notranslate ${geistSans.variable} ${geistMono.variable} ${literata.variable} min-h-screen font-sans antialiased`}
        translate="no"
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
