// src/app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PCB & AOI Dashboard",
  description: "Industrial AI Maintenance and Inspection Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 text-gray-800`}
      >
        {/* Top Navigation */}
        <header className="bg-gray-900 text-gray-200 shadow-md">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="text-xl font-bold tracking-wider">
              <Link href="/" className="hover:text-white">
                AOI View
              </Link>
            </div>
            <ul className="flex space-x-8 uppercase text-sm font-medium">
              <li>
                <Link
                  href="/maintenance-logs"
                  className="hover:text-white transition-colors"
                >
                  Maintenance Logs
                </Link>
              </li>
              <li>
                <Link
                  href="/report-dashboard"
                  className="hover:text-white transition-colors"
                >
                  Report Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/voice-assistant"
                  className="hover:text-white transition-colors"
                >
                  Voice Assistant
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        {/* Page Content */}
        <main className="pt-8 pb-16 px-6 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
