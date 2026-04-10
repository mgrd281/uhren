"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Input, Button, Skeleton } from "@/components/ui";
import { toast } from "sonner";
import { Save } from "lucide-react";

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
    </div>
  );
}
