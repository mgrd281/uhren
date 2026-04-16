"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldX,
  Trash2,
  LogOut,
  Monitor,
  Globe,
  AlertTriangle,
  Fingerprint,
  Eye,
  Pencil,
  ShieldAlert,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";

/* ── Roles ── */
const ROLES = [
  { value: "viewer", label: "Nur Ansicht", icon: Eye, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200", desc: "Kann Produkte & Verkäufe sehen, aber nichts ändern" },
  { value: "editor", label: "Bearbeiter", icon: Pencil, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200", desc: "Kann Preise ändern & Produkte bearbeiten" },
  { value: "manager", label: "Manager", icon: ShieldAlert, color: "text-purple-600", bg: "bg-purple-50", ring: "ring-purple-200", desc: "Voller Zugriff außer Einstellungen & Benutzerverwaltung" },
];

const STATUS_TABS = [
  { value: "all", label: "Alle", icon: Users },
  { value: "pending", label: "Ausstehend", icon: Clock },
  { value: "approved", label: "Genehmigt", icon: CheckCircle2 },
  { value: "rejected", label: "Abgelehnt", icon: XCircle },
];

interface AccessRequest {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  status: string;
  ip: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  fingerprint: string | null;
  googleUid: string;
  role: string;
  createdAt: string;
}

/* ── Helpers ── */
function getDeviceLabel(ua: string) {
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  let os = "Unbekannt";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS/i.test(ua)) os = "macOS";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "";
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edg/i.test(ua)) browser = "Edge";
  const device = isTablet ? "Tablet" : isMobile ? "Handy" : "Desktop";
  return `${device} · ${os}${browser ? ` · ${browser}` : ""}`;
}

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const isOwner = (session as unknown as { role?: string })?.role === "owner";

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!isOwner) {
      router.replace("/dashboard");
      return;
    }
    fetch("/api/access-requests")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRequests(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOwner, sessionStatus, router]);

  /* ── Actions ── */
  async function handleAction(id: string, action: "approve" | "reject" | "revoke" | "delete") {
    setActionLoading(`${id}-${action}`);
    try {
      const res = await fetch("/api/access-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        if (action === "delete") {
          setRequests((prev) => prev.filter((r) => r.id !== id));
          toast.success("Anfrage gelöscht");
        } else if (action === "approve") {
          setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" } : r));
          toast.success("Zugriff genehmigt");
        } else if (action === "revoke") {
          setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "revoked" } : r));
          toast.success("Zugriff widerrufen");
        } else {
          setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" } : r));
          toast.success("Zugriff abgelehnt");
        }
      } else {
        toast.error("Aktion fehlgeschlagen");
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setActionLoading("");
    }
  }

  async function handleRoleChange(id: string, role: string) {
    try {
      const res = await fetch("/api/access-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      if (res.ok) {
        setRequests((prev) => prev.map((r) => r.id === id ? { ...r, role } : r));
        const label = ROLES.find((r) => r.value === role)?.label || role;
        toast.success(`Rolle geändert: ${label}`);
      }
    } catch {
      toast.error("Verbindungsfehler");
    }
  }

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected" || r.status === "revoked").length,
  }), [requests]);

  /* ── Filtered + grouped ── */
  const filteredRequests = useMemo(() => {
    let filtered = requests;
    if (statusFilter !== "all") {
      if (statusFilter === "rejected") {
        filtered = filtered.filter((r) => r.status === "rejected" || r.status === "revoked");
      } else {
        filtered = filtered.filter((r) => r.status === statusFilter);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) => r.email.toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q) || (r.ip || "").includes(q)
      );
    }
    return filtered;
  }, [requests, statusFilter, search]);

  /* Group by fingerprint */
  const grouped = useMemo(() => {
    const groups: { fp: string | null; members: AccessRequest[] }[] = [];
    const seen = new Set<string>();
    for (const req of filteredRequests) {
      if (seen.has(req.id)) continue;
      if (req.fingerprint) {
        const siblings = filteredRequests.filter((o) => o.fingerprint === req.fingerprint);
        if (siblings.length > 1) {
          siblings.forEach((s) => seen.add(s.id));
          groups.push({ fp: req.fingerprint, members: siblings });
          continue;
        }
      }
      seen.add(req.id);
      groups.push({ fp: null, members: [req] });
    }
    return groups;
  }, [filteredRequests]);

  if (sessionStatus === "loading" || (loading && isOwner)) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Zugriffsanfragen"
        description="Benutzeranfragen verwalten, Rollen zuweisen und verdächtige Aktivitäten überwachen"
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Gesamt", value: stats.total, icon: Users, color: "text-zinc-600", bg: "bg-zinc-50" },
          { label: "Ausstehend", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Genehmigt", value: stats.approved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Abgelehnt", value: stats.rejected, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
        ].map((kpi) => (
          <Card key={kpi.label} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{kpi.label}</p>
                <p className={cn("mt-2 text-3xl font-bold", kpi.color)}>{kpi.value}</p>
              </div>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.bg)}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
            </div>
            {kpi.label === "Ausstehend" && kpi.value > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500 animate-pulse" />
            )}
          </Card>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex gap-1 rounded-2xl bg-zinc-100/80 p-1">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            const count = tab.value === "all" ? stats.total
              : tab.value === "pending" ? stats.pending
              : tab.value === "approved" ? stats.approved
              : stats.rejected;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all",
                  active
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    active ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-500"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" />
          <input
            type="text"
            placeholder="Name, E-Mail oder IP suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 text-[13px] text-zinc-700 outline-none transition-all placeholder:text-zinc-300 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100 sm:w-72"
          />
        </div>
      </div>

      {/* ── Request List ── */}
      {grouped.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50">
              <Users size={28} className="text-zinc-300" />
            </div>
            <p className="mt-4 text-[14px] font-semibold text-zinc-400">
              {search ? "Keine Ergebnisse gefunden" : "Keine Anfragen vorhanden"}
            </p>
            <p className="mt-1 text-[12px] text-zinc-300">
              {search ? "Versuche einen anderen Suchbegriff" : "Neue Anfragen erscheinen hier automatisch"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => {
            const isMulti = group.members.length > 1;
            const first = group.members[0];

            const sameIpOnly = !isMulti && first.ip
              ? requests.some((o) => o.id !== first.id && o.ip === first.ip && o.email !== first.email)
              : false;

            return (
              <div
                key={group.fp || first.id}
                className={cn(
                  "rounded-2xl border bg-white transition-all hover:shadow-md",
                  isMulti ? "border-red-200 bg-red-50/10 shadow-red-100/40" : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                {/* Multi-account warning */}
                {isMulti && (
                  <div className="flex items-center gap-3 border-b border-red-100 bg-red-50/50 px-6 py-3 rounded-t-2xl">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                      <Fingerprint size={16} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-red-700">Mehrere Konten – gleiches Gerät erkannt</p>
                      <p className="text-[10px] text-red-500">{group.members.length} Konten mit identischem Browser-Fingerprint</p>
                    </div>
                    <span className="ml-auto rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-600">
                      {group.members.length} Konten
                    </span>
                  </div>
                )}

                {/* User rows */}
                <div className="divide-y divide-zinc-100">
                  {group.members.map((req) => (
                    <div key={req.id} className="px-6 py-5">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        {req.image ? (
                          <img src={req.image} alt="" className="h-11 w-11 shrink-0 rounded-full ring-2 ring-zinc-100" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 text-[14px] font-bold text-zinc-500">
                            {(req.name || req.email)[0]?.toUpperCase()}
                          </div>
                        )}

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[14px] font-semibold text-zinc-900">{req.name || "Unbekannt"}</p>
                            {req.status === "pending" && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600">Neu</span>
                            )}
                          </div>
                          <p className="truncate text-[12px] text-zinc-400">{req.email}</p>
                          <p className="mt-1 text-[11px] text-zinc-300">
                            {new Date(req.createdAt).toLocaleDateString("de-DE", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {req.status === "pending" && (
                            <>
                              <button onClick={() => handleAction(req.id, "approve")} disabled={!!actionLoading}
                                className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-4 text-[12px] font-semibold text-emerald-600 transition-all hover:bg-emerald-100 hover:shadow-sm active:scale-95 disabled:opacity-50">
                                <ShieldCheck size={15} />
                                {actionLoading === `${req.id}-approve` ? "…" : "Genehmigen"}
                              </button>
                              <button onClick={() => handleAction(req.id, "reject")} disabled={!!actionLoading}
                                className="flex h-9 items-center gap-1.5 rounded-xl bg-red-50 px-4 text-[12px] font-semibold text-red-500 transition-all hover:bg-red-100 hover:shadow-sm active:scale-95 disabled:opacity-50">
                                <ShieldX size={15} />
                                {actionLoading === `${req.id}-reject` ? "…" : "Ablehnen"}
                              </button>
                            </>
                          )}
                          {req.status === "approved" && (
                            <>
                              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-100">
                                <CheckCircle2 size={12} className="mr-1 inline" />
                                Genehmigt
                              </span>
                              <button onClick={() => handleAction(req.id, "revoke")} disabled={!!actionLoading}
                                className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-50 px-3 text-[12px] font-semibold text-amber-600 transition-all hover:bg-amber-100 hover:shadow-sm active:scale-95 disabled:opacity-50">
                                <LogOut size={14} />
                                {actionLoading === `${req.id}-revoke` ? "…" : "Widerrufen"}
                              </button>
                            </>
                          )}
                          {(req.status === "rejected" || req.status === "revoked") && (
                            <span className={cn(
                              "rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1",
                              req.status === "revoked"
                                ? "bg-amber-50 text-amber-600 ring-amber-100"
                                : "bg-red-50 text-red-500 ring-red-100"
                            )}>
                              {req.status === "revoked" ? "Widerrufen" : "Abgelehnt"}
                            </span>
                          )}
                          {req.status !== "pending" && (
                            <button onClick={() => handleAction(req.id, "delete")} disabled={!!actionLoading}
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-300 transition-all hover:bg-zinc-100 hover:text-zinc-500 active:scale-95 disabled:opacity-50">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Role selector */}
                      {(req.status === "approved" || req.status === "pending") && (
                        <div className="mt-4 rounded-xl bg-zinc-50/80 px-4 py-3">
                          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Rolle zuweisen</p>
                          <div className="flex flex-wrap gap-2">
                            {ROLES.map((role) => {
                              const RoleIcon = role.icon;
                              const active = req.role === role.value;
                              return (
                                <button
                                  key={role.value}
                                  onClick={() => handleRoleChange(req.id, role.value)}
                                  title={role.desc}
                                  className={cn(
                                    "flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-semibold transition-all active:scale-95",
                                    active
                                      ? `${role.bg} ${role.color} ring-1 ${role.ring} shadow-sm`
                                      : "bg-white text-zinc-400 ring-1 ring-zinc-100 hover:ring-zinc-200 hover:text-zinc-600"
                                  )}
                                >
                                  <RoleIcon size={14} />
                                  {role.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Shared device info */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-100 bg-zinc-50/40 px-6 py-3 rounded-b-2xl">
                  {first.ip && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Globe size={12} className="shrink-0 text-zinc-300" />
                      <span className="font-mono">{first.ip}</span>
                      {(first.city || first.country) && (
                        <span className="text-zinc-300">({[first.city, first.country].filter(Boolean).join(", ")})</span>
                      )}
                    </div>
                  )}
                  {first.userAgent && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Monitor size={12} className="shrink-0 text-zinc-300" />
                      <span>{getDeviceLabel(first.userAgent)}</span>
                    </div>
                  )}
                  {first.fingerprint && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Fingerprint size={12} className="shrink-0 text-zinc-300" />
                      <span className="font-mono">{first.fingerprint}</span>
                    </div>
                  )}
                  {sameIpOnly && (
                    <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-600">
                      <AlertTriangle size={12} />
                      Gleiche IP, anderer Account
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
