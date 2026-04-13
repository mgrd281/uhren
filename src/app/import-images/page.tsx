"use client";

import { useState } from "react";
import { Button, PageHeader, Card, Input } from "@/components/ui";
import { toast } from "sonner";
import { RefreshCw, Download } from "lucide-react";
import Link from "next/link";

const BRANDS = [
  { name: "Boss", value: "BOSS" },
  { name: "Armani", value: "Armani" },
  { name: "Diesel", value: "Diesel" },
  { name: "Armani Exchange", value: "Armani Exchange" },
  { name: "Maserati", value: "Maserati" },
  { name: "Daniel Wellington", value: "Daniel Wellington" },
  { name: "Michael Kors", value: "Michael Kors" },
];

interface ImportResult {
  message: string;
  imported: number;
  productsMatched?: number;
}

export default function ImportImagesPage() {
  const [selectedBrand, setSelectedBrand] = useState<string>("BOSS");
  const [customSearch, setCustomSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [lastImport, setLastImport] = useState<{
    brand: string;
    time: Date;
    result: ImportResult;
  } | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [autoUpdateInterval, setAutoUpdateInterval] = useState(3600); // 1 hour in seconds

  async function handleImport() {
    setImporting(true);
    try {
      const searchTerm = customSearch || selectedBrand;
      const res = await fetch("/api/import-shopify-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: selectedBrand, productName: searchTerm }),
      });

      if (res.ok) {
        const data: ImportResult = await res.json();
        setLastImport({
          brand: selectedBrand,
          time: new Date(),
          result: data,
        });
        toast.success(`${data.imported} Bilder importiert`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Import fehlgeschlagen");
      }
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Shopify Bilder importieren"
        description="Importiere Produktbilder automatisch von deinem Shopify Store"
        actions={
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              Zurück
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Manual Import */}
        <Card>
          <div className="mb-6 flex items-center gap-2">
            <Download size={18} className="text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-700">Manueller Import</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[12px] font-medium text-zinc-600">
                Marke wählen
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BRANDS.map((brand) => (
                  <button
                    key={brand.value}
                    onClick={() => setSelectedBrand(brand.value)}
                    className={`rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${
                      selectedBrand === brand.value
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[12px] font-medium text-zinc-600">
                Oder Produktname eingeben (optional)
              </label>
              <Input
                placeholder="z.B. BOSS 1513757"
                value={customSearch}
                onChange={(e) => setCustomSearch(e.target.value)}
              />
            </div>

            <Button
              onClick={handleImport}
              disabled={importing}
              className="w-full"
            >
              {importing ? "Importiere..." : "Bilder importieren"}
            </Button>

            {lastImport && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-[11px] text-emerald-600">
                  Letzer Import: {lastImport.time.toLocaleTimeString("de-DE")}
                </p>
                <p className="text-[13px] font-medium text-emerald-700">
                  {lastImport.result.imported} Bilder importiert
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Auto Update Settings */}
        <Card>
          <div className="mb-6 flex items-center gap-2">
            <RefreshCw size={18} className="text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-700">Automatische Updates</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3 cursor-pointer transition-colors hover:bg-zinc-50">
              <input
                type="checkbox"
                checked={autoUpdateEnabled}
                onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-zinc-300 text-zinc-600 accent-zinc-600"
              />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-zinc-700">
                  Automatische Updates aktivieren
                </p>
                <p className="text-[11px] text-zinc-400">
                  Importiere regelmäßig neue Bilder
                </p>
              </div>
            </label>

            {autoUpdateEnabled && (
              <div>
                <label className="mb-2 block text-[12px] font-medium text-zinc-600">
                  Update-Intervall
                </label>
                <select
                  value={autoUpdateInterval}
                  onChange={(e) => setAutoUpdateInterval(parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 focus:border-zinc-400 focus:outline-none"
                >
                  <option value={1800}>Alle 30 Minuten</option>
                  <option value={3600}>Jede Stunde</option>
                  <option value={7200}>Alle 2 Stunden</option>
                  <option value={86400}>Täglich</option>
                </select>
              </div>
            )}

            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-[11px] text-zinc-400">
                💡 Automatische Updates werden als Background-Job ausgeführt und
                aktualisieren Ihre Bilder regelmäßig.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Import Status */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-zinc-700">Import-Status</h3>
        <div className="space-y-3">
          {BRANDS.map((brand) => (
            <div
              key={brand.value}
              className="flex items-center justify-between rounded-lg border border-zinc-100 p-3"
            >
              <span className="text-[13px] font-medium text-zinc-600">{brand.name}</span>
              <span className="text-[12px] text-zinc-400">
                Bereit zum Import
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
