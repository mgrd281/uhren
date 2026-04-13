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
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produkte", icon: Watch },
  { href: "/products/add", label: "Produkt hinzufügen", icon: PlusCircle },
  { href: "/import-images", label: "Shopify Bilder", icon: Image },
  { href: "/sales", label: "Verkäufe", icon: ShoppingBag },
  { href: "/reports", label: "Berichte", icon: BarChart3 },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-lg backdrop-blur-md lg:hidden"
        aria-label="toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-zinc-100 bg-white/70 px-4 py-8 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
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
                onClick={() => setOpen(false)}
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
          <p className="text-center text-[10px] text-zinc-300">
            Luxury Watch SaaS v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
