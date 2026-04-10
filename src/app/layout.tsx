import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SettingsProvider } from "@/components/providers";
import Sidebar from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "دار الساعات الفاخرة",
  description: "نظام إدارة المخزون والمبيعات للساعات الفاخرة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#fafafa]">
        <SettingsProvider>
          <Sidebar />
          <main className="min-h-screen transition-all duration-300 lg:ps-[260px]">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
              {children}
            </div>
          </main>
          <Toaster
            position="bottom-left"
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
