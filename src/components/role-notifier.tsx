"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  Pencil,
  Eye,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

type Role = "owner" | "manager" | "editor" | "viewer";

const POLL_INTERVAL = 15_000; // 15 seconds
const STORAGE_KEY = "uhren-last-role";

const ROLE_META: Record<
  Role,
  { label: string; icon: typeof Shield; color: string; bg: string; ring: string }
> = {
  owner: {
    label: "Owner",
    icon: Shield,
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
  },
  manager: {
    label: "Manager",
    icon: ShieldCheck,
    color: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
  },
  editor: {
    label: "Editor",
    icon: Pencil,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "text-zinc-500",
    bg: "bg-zinc-50",
    ring: "ring-zinc-200",
  },
};

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  manager: 2,
  owner: 3,
};

function getCapabilities(role: Role): string[] {
  switch (role) {
    case "owner":
      return ["Vollzugriff auf alle Funktionen", "Benutzer verwalten", "Einstellungen ändern"];
    case "manager":
      return ["Produkte bearbeiten & löschen", "Verkäufe erfassen & löschen", "Berichte anzeigen"];
    case "editor":
      return ["Produkte bearbeiten & hinzufügen", "Verkäufe erfassen", "Berichte anzeigen"];
    case "viewer":
      return ["Produkte & Berichte anzeigen", "Keine Bearbeitungsrechte"];
  }
}

export default function RoleNotifier() {
  const { data: session, status } = useSession();
  const lastRole = useRef<Role | null>(null);
  const initialized = useRef(false);

  const checkRole = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const res = await fetch("/api/user-role");
      if (!res.ok) return;
      const data = await res.json();
      const newRole = data.role as Role | null;
      if (!newRole) return;

      // First load — set without notifying
      if (!initialized.current) {
        lastRole.current = newRole;
        localStorage.setItem(STORAGE_KEY, newRole);
        initialized.current = true;
        return;
      }

      const prevRole = lastRole.current;
      if (prevRole && prevRole !== newRole) {
        lastRole.current = newRole;
        localStorage.setItem(STORAGE_KEY, newRole);
        showRoleChangeToast(prevRole, newRole);
      }
    } catch {
      // Network error — silently ignore
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    // Restore from storage on mount
    const stored = localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored) lastRole.current = stored;

    // Initial check
    checkRole();

    const interval = setInterval(checkRole, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [status, checkRole]);

  return null;
}

function showRoleChangeToast(prev: Role, next: Role) {
  const isUpgrade = ROLE_RANK[next] > ROLE_RANK[prev];
  const meta = ROLE_META[next];
  const Icon = meta.icon;
  const capabilities = getCapabilities(next);

  toast.custom(
    (t) => (
      <div
        className={`w-[360px] rounded-2xl border bg-white p-0 shadow-2xl shadow-zinc-300/40 ring-1 ${meta.ring} overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-500`}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-3 px-5 py-4 ${meta.bg} border-b border-zinc-100/80`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.bg} ${meta.color} ring-1 ${meta.ring}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isUpgrade ? (
                <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5 text-orange-500" />
              )}
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                {isUpgrade ? "Rolle hochgestuft" : "Rolle geändert"}
              </span>
            </div>
            <p className={`text-base font-bold ${meta.color} mt-0.5`}>
              {meta.label}
            </p>
          </div>
          <Sparkles
            className={`h-5 w-5 ${isUpgrade ? "text-amber-400 animate-pulse" : "text-zinc-300"}`}
          />
        </div>

        {/* Capabilities */}
        <div className="px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Deine Berechtigungen
          </p>
          <ul className="space-y-1.5">
            {capabilities.map((cap, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-zinc-600">
                <span
                  className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                    isUpgrade ? "bg-emerald-400" : "bg-zinc-300"
                  }`}
                />
                {cap}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            {ROLE_META[prev].label} → {meta.label}
          </span>
          <button
            onClick={() => toast.dismiss(t)}
            className={`text-[12px] font-semibold ${meta.color} hover:underline transition-colors`}
          >
            Verstanden
          </button>
        </div>
      </div>
    ),
    {
      duration: 12000,
      position: "bottom-right",
    }
  );
}
