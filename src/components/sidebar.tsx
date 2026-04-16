"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Watch,
  ShoppingBag,
  BarChart3,
  Settings,
  PlusCircle,
  Image,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produkte", icon: Watch },
  { href: "/products/add", label: "Produkt hinzufügen", icon: PlusCircle },
  { href: "/import-images", label: "Shopify Bilder", icon: Image },
  { href: "/sales", label: "Verkäufe", icon: ShoppingBag },
  { href: "/reports", label: "Berichte", icon: BarChart3 },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

/* Bottom tab bar items (mobile app) */
const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produkte", icon: Watch },
  { href: "/sales", label: "Verkäufe", icon: ShoppingBag },
  { href: "/reports", label: "Berichte", icon: BarChart3 },
  { href: "/settings", label: "Mehr", icon: Menu },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hide sidebar on login page
  if (pathname === "/login") return null;

  return (
    <>
      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-xl lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-1 pt-1.5 pb-1">
          {tabs.map((tab) => {
            const active =
              pathname === tab.href || pathname.startsWith(tab.href + "/");
            /* "Mehr" button opens the full menu */
            if (tab.label === "Mehr") {
              return (
                <button
                  key="more"
                  onClick={() => setOpen(!open)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px]",
                    open ? "text-gold-500" : "text-zinc-400"
                  )}
                >
                  {open ? <X size={22} /> : <Menu size={22} />}
                  <span className="text-[10px] font-medium">Mehr</span>
                </button>
              );
            }
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px]",
                  active
                    ? "text-zinc-900"
                    : "text-zinc-400 active:text-zinc-600"
                )}
              >
                <tab.icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                <span className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Mobile "Mehr" overlay menu ── */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-[68px] left-3 right-3 z-50 rounded-2xl border border-zinc-100 bg-white p-3 shadow-2xl lg:hidden safe-area-bottom">
            {nav
              .filter((item) => !tabs.some((t) => t.href === item.href))
              .map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium transition-colors",
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 active:bg-zinc-100"
                    )}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                );
              })}

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-red-500 transition-colors active:bg-red-50"
            >
              <LogOut size={20} />
              Abmelden
            </button>
          </div>
        </>
      )}

      {/* ── Desktop Sidebar (unchanged) ── */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-zinc-100 bg-white/70 px-4 py-8 backdrop-blur-xl lg:flex"
      >
        {/* Brand */}
        <div className="mb-10 px-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <Watch size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-zinc-900">
                Luxusuhren
              </h1>
              <p className="text-[11px] text-zinc-400">Verwaltungssystem</p>
            </div>
          </Link>
        </div>

        {/* Links */}
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                  active
                    ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/20"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <item.icon
                  size={18}
                  className={cn(
                    "shrink-0 transition-colors",
                    active ? "text-white" : "text-zinc-400 group-hover:text-zinc-700"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto border-t border-zinc-100 pt-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} className="shrink-0 text-zinc-400 group-hover:text-red-500" />
            Abmelden
          </button>
          <p className="mt-3 text-center text-[10px] text-zinc-300">
            Luxury Watch SaaS v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
