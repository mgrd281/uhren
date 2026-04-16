import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SettingsProvider } from "@/components/providers";
import Sidebar from "@/components/sidebar";
import ServiceWorker from "@/components/service-worker";

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
  themeColor: "#e6a817",
};

export const metadata: Metadata = {
  title: "Luxusuhren Verwaltung",
  description: "Bestands- und Verkaufsverwaltung für Luxusuhren",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Uhren",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    type: "website",
    siteName: "Luxusuhren Verwaltung",
  },
  twitter: {
    card: "summary",
    title: "Luxusuhren Verwaltung",
    description: "Bestands- und Verkaufsverwaltung für Luxusuhren",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      dir="ltr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#fafafa]">
        <ServiceWorker />
        <SettingsProvider>
          <Sidebar />
          <main className="min-h-screen transition-all duration-300 lg:pl-[260px]">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
              {children}
            </div>
          </main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className:
                "!rounded-xl !border-zinc-100 !shadow-lg !text-[13px]",
            }}
          />
        </SettingsProvider>
      </body>
    </html>
  );
}
