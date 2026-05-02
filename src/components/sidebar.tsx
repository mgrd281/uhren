"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Watch,
  ShoppingBag,
  BarChart3,
  Settings,
  PlusCircle,
  Image as ImageIcon,
  Menu,
  X,
  LogOut,
  UserCheck,
  ClipboardList,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";

const nav: { href: string; label: string; icon: typeof LayoutDashboard; badge?: boolean; ownerOnly?: boolean; editOnly?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produkte", icon: Watch },
  { href: "/products/add", label: "Produkt hinzufügen", icon: PlusCircle, editOnly: true },
  { href: "/import-images", label: "Shopify Bilder", icon: ImageIcon, editOnly: true },
  { href: "/sales", label: "Verkäufe", icon: ShoppingBag },
  { href: "/inventory", label: "Bestandscheck", icon: ClipboardList },
  { href: "/reports", label: "Berichte", icon: BarChart3 },
  { href: "/access-requests", label: "Zugriffsanfragen", icon: UserCheck, badge: true, ownerOnly: true },
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
  const [pendingCount, setPendingCount] = useState(0);
  const prevCountRef = useRef(0);
  const { data: session } = useSession();
  const role = ((session?.user as unknown as { role?: string })?.role) || "viewer";
  const isOwner = role === "owner";
  const userCanEdit = role === "owner" || role === "manager" || role === "editor";

  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  /* Filter nav items based on role */
  const visibleNav = nav.filter((item) => {
    if (item.ownerOnly && !isOwner) return false;
    if (item.editOnly && !userCanEdit) return false;
    return true;
  });

  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      // Chime: two pleasant tones
      const play = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      play(880, 0, 0.15);
      play(1320, 0.12, 0.2);
    } catch {
      // Audio not available
    }
  }, []);

  const showBrowserNotification = useCallback((count: number) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification("Neue Zugriffsanfrage", {
        body: `${count} neue Anfrage${count > 1 ? "n" : ""} wartet auf Genehmigung`,
        icon: "/icon-192.png",
        tag: "access-request",
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    // Ask for notification permission on first load
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const check = () => {
      fetch("/api/access-requests")
        .then((r) => r.json())
        .then((data: { status?: string }[]) => {
          if (Array.isArray(data)) {
            const count = data.filter((r) => r.status === "pending").length;
            if (count > prevCountRef.current && prevCountRef.current >= 0) {
              playNotificationSound();
              showBrowserNotification(count);
            }
            prevCountRef.current = count;
            setPendingCount(count);
          }
        })
        .catch(() => {});
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [isOwner, playNotificationSound, showBrowserNotification]);

  // Hide sidebar on login page
  if (pathname === "/login") return null;

  return (
    <>
      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/60 bg-white/80 backdrop-blur-2xl lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-1 pt-2 pb-1.5">
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
                    "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-[56px]",
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
                  "relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-[56px]",
                  active
                    ? "text-zinc-900"
                    : "text-zinc-400 active:text-zinc-600"
                )}
              >
                {active && (
                  <span className="absolute -top-2 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-zinc-900" />
                )}
                <tab.icon size={22} strokeWidth={active ? 2.2 : 1.6} />
                <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>
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
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-[72px] left-3 right-3 z-50 rounded-3xl border border-zinc-100 bg-white/95 p-2 shadow-2xl shadow-black/20 backdrop-blur-2xl lg:hidden safe-area-bottom animate-fade-in-scale">
            {visibleNav
              .filter((item) => !tabs.some((t) => t.href === item.href))
              .map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[14px] font-medium transition-all duration-200",
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 active:bg-zinc-100"
                    )}
                  >
                    <item.icon size={20} strokeWidth={1.8} />
                    {item.label}
                  </Link>
                );
              })}

            {/* Divider */}
            <div className="mx-4 my-1 h-px bg-zinc-100" />

            {/* Profile row */}
            {session?.user && (
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                <div className="relative shrink-0 h-9 w-9 rounded-full overflow-hidden bg-zinc-200 ring-2 ring-white shadow">
                  {session.user.image ? (
                    <Image src={session.user.image} alt={session.user.name || ""} fill className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[12px] font-bold text-zinc-500">
                      {(session.user.name || session.user.email || "?")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-zinc-800">{session.user.name || session.user.email}</p>
                  <p className="text-[11px] font-medium capitalize text-zinc-400">{role}</p>
                </div>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-[14px] font-medium text-red-500 transition-all duration-200 active:bg-red-50"
            >
              <LogOut size={20} strokeWidth={1.8} />
              Abmelden
            </button>
          </div>
        </>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-zinc-100/80 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/80 px-4 py-8 backdrop-blur-2xl lg:flex"
      >
        {/* Brand */}
        <div className="mb-10 px-3">
          <Link href="/dashboard" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/25 transition-transform duration-300 group-hover:scale-105">
              <Watch size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Luxusuhren
              </h1>
              <p className="text-[11px] font-medium text-zinc-400">Verwaltungssystem</p>
            </div>
          </Link>
        </div>

        {/* Links */}
        <nav className="flex flex-1 flex-col gap-0.5">
          {visibleNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                  active
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/20"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <item.icon
                  size={18}
                  strokeWidth={active ? 2 : 1.6}
                  className={cn(
                    "shrink-0 transition-all duration-200",
                    active ? "text-white" : "text-zinc-400 group-hover:text-zinc-700"
                  )}
                />
                {item.label}
                {item.badge && pendingCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
                {active && !item.badge && (
                  <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-gold-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto border-t border-zinc-100/80 dark:border-zinc-800/50 pt-4 space-y-1">
          {/* Profile card */}
          {session?.user && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div className="relative shrink-0 h-8 w-8 rounded-full overflow-hidden bg-zinc-200 ring-2 ring-white shadow">
                {session.user.image ? (
                  <Image src={session.user.image} alt={session.user.name || ""} fill className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-zinc-500">
                    {(session.user.name || session.user.email || "?")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-zinc-800">{session.user.name || session.user.email}</p>
                <p className="text-[10px] font-medium capitalize text-zinc-400">{role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} strokeWidth={1.6} className="shrink-0 text-zinc-400 group-hover:text-red-500" />
            Abmelden
          </button>
          <button
            onClick={toggleDark}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-medium text-zinc-400 transition-all duration-200 hover:bg-zinc-100/80 hover:text-zinc-700"
          >
            {dark ? <Sun size={16} strokeWidth={1.6} className="shrink-0" /> : <Moon size={16} strokeWidth={1.6} className="shrink-0" />}
            {dark ? "Heller Modus" : "Dunkler Modus"}
          </button>
        </div>
      </aside>
    </>
  );
}
