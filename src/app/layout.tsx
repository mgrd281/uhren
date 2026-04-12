import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Luxusuhren Verwaltung",
  description: "Bestands- und Verkaufsverwaltung für Luxusuhren",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Uhren",
  },
  formatDetection: {
    telephone: false,
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
