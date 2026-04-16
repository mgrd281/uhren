"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Input, Button, Skeleton } from "@/components/ui";
import { toast } from "sonner";
import { Save, Download, FileJson, FileSpreadsheet, Database, ShieldCheck, ShieldX, Trash2, UserCheck, LogOut, Monitor, Globe, AlertTriangle } from "lucide-react";

interface Settings {
  storeName: string;
  locale: string;
  currencyCode: string;
  rtlEnabled: boolean;
}

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
  googleUid: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<"json" | "csv" | "">("");
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<string>("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .finally(() => setLoading(false));
    fetch("/api/access-requests")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRequests(d); })
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Einstellungen gespeichert");
      } else {
        toast.error("Speichern fehlgeschlagen");
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setSaving(false);
    }
  }

  async function downloadBackup(format: "json" | "csv") {
    setDownloading(format);
    try {
      const res = await fetch(`/api/backup?format=${format}`);
      if (!res.ok) {
        toast.error("Backup fehlgeschlagen");
        return;
      }
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+?)"/);
      const filename = match?.[1] || `uhren-backup.${format}`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Backup als ${format.toUpperCase()} heruntergeladen`);
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setDownloading("");
    }
  }

  async function handleAccessAction(id: string, action: "approve" | "reject" | "revoke" | "delete") {
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
          toast.success("Zugriff widerrufen — Benutzer wird beim nächsten Laden abgemeldet");
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Einstellungen"
        description="Shop- und Systemeinstellungen"
      />

      <Card className="max-w-2xl">
        <h3 className="mb-6 text-sm font-semibold text-zinc-700">
          Shop-Informationen
        </h3>
        <div className="space-y-5">
          <Input
            label="Shop-Name"
            value={settings.storeName}
            onChange={(e) =>
              setSettings((s) => s && { ...s, storeName: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sprache"
              value={settings.locale}
              onChange={(e) =>
                setSettings((s) => s && { ...s, locale: e.target.value })
              }
            />
            <Input
              label="Währung"
              value={settings.currencyCode}
              onChange={(e) =>
                setSettings((s) => s && { ...s, currencyCode: e.target.value })
              }
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.rtlEnabled}
              onChange={(e) =>
                setSettings((s) => s && { ...s, rtlEnabled: e.target.checked })
              }
              className="h-4 w-4 rounded border-zinc-300"
            />
            <span className="text-[13px] text-zinc-700">
              Rechts-nach-Links-Richtung aktivieren (RTL)
            </span>
          </label>
        </div>
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? "Speichern..." : "Einstellungen speichern"}
          </Button>
        </div>
      </Card>

      {/* ── Backup / Export ── */}
      <Card className="max-w-2xl">
        <div className="mb-1 flex items-center gap-2.5">
          <Database size={18} className="text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-700">
            Daten-Backup
          </h3>
        </div>
        <p className="mb-5 text-[12px] text-zinc-400">
          Alle Produkte, Verkäufe und Lagerbewegungen exportieren
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* JSON backup */}
          <button
            onClick={() => downloadBackup("json")}
            disabled={!!downloading}
            className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-left transition-all hover:border-zinc-300 hover:shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <FileJson size={20} className="text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-zinc-900">
                {downloading === "json" ? "Wird heruntergeladen…" : "JSON-Backup"}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Komplett mit allen Details
              </p>
            </div>
            <Download size={16} className="shrink-0 text-zinc-400" />
          </button>

          {/* CSV backup */}
          <button
            onClick={() => downloadBackup("csv")}
            disabled={!!downloading}
            className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-left transition-all hover:border-zinc-300 hover:shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <FileSpreadsheet size={20} className="text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-zinc-900">
                {downloading === "csv" ? "Wird heruntergeladen…" : "CSV-Export"}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Für Excel / Google Sheets
              </p>
            </div>
            <Download size={16} className="shrink-0 text-zinc-400" />
          </button>
        </div>
      </Card>

      {/* ── Access Requests ── */}
      <Card className="max-w-2xl">
        <div className="mb-1 flex items-center gap-2.5">
          <UserCheck size={18} className="text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-700">
            Zugriffsanfragen
          </h3>
          {requests.filter((r) => r.status === "pending").length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {requests.filter((r) => r.status === "pending").length}
            </span>
          )}
        </div>
        <p className="mb-5 text-[12px] text-zinc-400">
          Benutzer die Zugriff auf das System angefragt haben
        </p>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 py-8 text-center">
            <p className="text-[13px] text-zinc-400">Keine Anfragen vorhanden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              /* Same-device detection: same IP used with a different email */
              const sameDevice = req.ip
                ? requests.some(
                    (other) =>
                      other.id !== req.id &&
                      other.ip === req.ip &&
                      other.email !== req.email
                  )
                : false;

              /* Parse user agent for a short device label */
              const deviceLabel = (() => {
                const ua = req.userAgent || "";
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
              })();

              return (
                <div
                  key={req.id}
                  className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 transition-all hover:border-zinc-300"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    {req.image ? (
                      <img
                        src={req.image}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[13px] font-bold text-zinc-500">
                        {(req.name || req.email)[0]?.toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-zinc-900">
                        {req.name || "Unbekannt"}
                      </p>
                      <p className="truncate text-[11px] text-zinc-400">{req.email}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-300">
                        {new Date(req.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Status / Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAccessAction(req.id, "approve")}
                            disabled={!!actionLoading}
                            className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-600 transition-all hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
                          >
                            <ShieldCheck size={14} />
                            {actionLoading === `${req.id}-approve` ? "…" : "Genehmigen"}
                          </button>
                          <button
                            onClick={() => handleAccessAction(req.id, "reject")}
                            disabled={!!actionLoading}
                            className="flex h-9 items-center gap-1.5 rounded-xl bg-red-50 px-3 text-[12px] font-semibold text-red-500 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50"
                          >
                            <ShieldX size={14} />
                            {actionLoading === `${req.id}-reject` ? "…" : "Ablehnen"}
                          </button>
                        </>
                      )}
                      {req.status === "approved" && (
                        <>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                            Genehmigt
                          </span>
                          <button
                            onClick={() => handleAccessAction(req.id, "revoke")}
                            disabled={!!actionLoading}
                            className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-50 px-3 text-[12px] font-semibold text-amber-600 transition-all hover:bg-amber-100 active:scale-95 disabled:opacity-50"
                          >
                            <LogOut size={14} />
                            {actionLoading === `${req.id}-revoke` ? "…" : "Widerrufen"}
                          </button>
                        </>
                      )}
                      {(req.status === "rejected" || req.status === "revoked") && (
                        <>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                              req.status === "revoked"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-red-50 text-red-500"
                            }`}
                          >
                            {req.status === "revoked" ? "Widerrufen" : "Abgelehnt"}
                          </span>
                        </>
                      )}
                      {req.status !== "pending" && (
                        <button
                          onClick={() => handleAccessAction(req.id, "delete")}
                          disabled={!!actionLoading}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-300 transition-all hover:bg-zinc-100 hover:text-zinc-500 active:scale-95 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Device info row */}
                  {(req.ip || req.userAgent) && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3">
                      {req.ip && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <Globe size={11} className="shrink-0 text-zinc-300" />
                          <span className="font-mono">{req.ip}</span>
                          {(req.city || req.country) && (
                            <span className="text-zinc-300">
                              ({[req.city, req.country].filter(Boolean).join(", ")})
                            </span>
                          )}
                        </div>
                      )}
                      {req.userAgent && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <Monitor size={11} className="shrink-0 text-zinc-300" />
                          <span>{deviceLabel}</span>
                        </div>
                      )}
                      {sameDevice && (
                        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                          <AlertTriangle size={11} />
                          Gleiche IP, anderer Account
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
