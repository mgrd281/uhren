"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Input, Button, Skeleton } from "@/components/ui";
import { toast } from "sonner";
import { Save, Download, FileJson, FileSpreadsheet, Database } from "lucide-react";

interface Settings {
  storeName: string;
  locale: string;
  currencyCode: string;
  rtlEnabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<"json" | "csv" | "">("");
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .finally(() => setLoading(false));
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
    </div>
  );
}
