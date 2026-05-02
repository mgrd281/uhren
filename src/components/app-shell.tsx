"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Login page gets a clean full-screen layout
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen transition-all duration-300 pb-20 lg:pb-0 lg:pl-[260px] bg-[#fafafa] dark:bg-[#0c0c0e]">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        {children}
      </div>
    </main>
  );
}
