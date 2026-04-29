"use client";

import { useState, useEffect } from "react";

interface DBProduct {
  id: string;
  model: string;
  brand: string;
  quantity: number;
}

interface ParsedItem {
  model: string;
  soll: number;
  ean: string;
  ist: number | null;
  ohneVerpackung: boolean;
}

interface ResultItem extends ParsedItem {
  dbQuantity: number;
  status: "ok" | "diff" | "unknown";
  diff: number;
}

function parseLines(text: string): ParsedItem[] {
  const results: ParsedItem[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const modelMatch = line.match(/\b([A-Z]{1,5}\d{3,6})\b/i);
    if (!modelMatch) continue;
    const model = modelMatch[1].toUpperCase();
    const allNums = [...line.matchAll(/\b(\d+)\b/g)].map((m) => parseInt(m[1], 10));
    const ean = allNums.find((n) => n.toString().length >= 10 && n.toString().length <= 14)?.toString() ?? "";
    const modelIdx = line.toUpperCase().indexOf(model);
    const afterModel = line.slice(modelIdx + model.length);
    const sollMatch = afterModel.match(/\b(\d{1,4})\b/);
    const soll = sollMatch ? parseInt(sollMatch[1], 10) : 0;
    const istMatch = line.match(/(\d{1,4})\s*St[\u00fcu]ck?\s+Aktueller\s+Bestand/i);
    const ist = istMatch ? parseInt(istMatch[1], 10) : null;
    const ohneVerpackung = /ohne\s*Verpackung/i.test(line);
    results.push({ model, soll, ean, ist, ohneVerpackung });
  }
  return results;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-5 py-4 ${accent ? "bg-zinc-900 text-white" : "bg-white border border-zinc-100"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${accent ? "text-white" : "text-zinc-900"}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${accent ? "text-zinc-500" : "text-zinc-400"}`}>{sub}</p>}
    </div>
  );
}

function DiffBadge({ diff }: { diff: number }) {
  if (diff === 0) return <span className="inline-flex h-6 items-center rounded-full bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-600">&#10003;</span>;
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold ${diff < 0 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
      {diff > 0 ? `+${diff}` : diff}
    </span>
  );
}

export default function InventoryPage() {
  const [brands, setBrands] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ResultItem[] | null>(null);
  const [brandLabel, setBrandLabel] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: DBProduct[]) => {
        if (Array.isArray(data)) {
          const unique = [...new Set(data.map((p) => p.brand))].sort();
          setBrands(unique);
        }
      })
      .catch(() => {});
  }, []);

  async function handleAnalyze() {
    if (!pasteText.trim()) return;
    setLoading(true);
    setItems(null);
    try {
      const parsed = parseLines(pasteText);
      if (parsed.length === 0) { setLoading(false); return; }
      const hasIstValues = parsed.some((p) => p.ist !== null);
      let dbMap: Record<string, number> = {};
      if (!hasIstValues && brand) {
        const res = await fetch(`/api/products?brand=${encodeURIComponent(brand)}`);
        const dbProducts: DBProduct[] = await res.json();
        dbMap = Object.fromEntries(dbProducts.map((p) => [p.model.toUpperCase().replace(/[^A-Z0-9]/g, ""), p.quantity]));
      } else if (hasIstValues) {
        parsed.forEach((p) => { if (p.ist !== null) dbMap[p.model] = p.ist; });
      }
      const result: ResultItem[] = parsed.map((item) => {
        const dbQty = dbMap[item.model] ?? (item.ist ?? -1);
        const eff = hasIstValues ? (item.ist ?? item.soll) : dbQty;
        const diff = eff - item.soll;
        const status: ResultItem["status"] = dbQty === -1 ? "unknown" : diff === 0 ? "ok" : "diff";
        return { ...item, dbQuantity: eff, status, diff };
      });
      setBrandLabel(brand || "");
      setItems(result);
    } catch {
      alert("Fehler beim Analysieren.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setItems(null);
    setPasteText("");
    setBrand("");
    setBrandLabel("");
  }

  const ok = items?.filter((i) => i.status === "ok") ?? [];
  const diffs = items?.filter((i) => i.status === "diff") ?? [];
  const unknown = items?.filter((i) => i.status === "unknown") ?? [];
  const ohneVerp = items?.filter((i) => i.ohneVerpackung) ?? [];
  const totalSoll = items?.reduce((s, i) => s + i.soll, 0) ?? 0;
  const totalIst = items?.reduce((s, i) => s + i.dbQuantity, 0) ?? 0;
  const fehlmenge = diffs.reduce((s, i) => s + Math.abs(i.diff), 0);

  return (
    <div className="animate-fade-in space-y-6 lg:space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">Bestandscheck</h1>
          <p className="mt-1 text-[12px] text-zinc-400 lg:text-sm">Gezählte Bestände mit dem System vergleichen</p>
        </div>
        {items && (
          <button onClick={handleReset} className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50 active:scale-95">
            Neue Analyse
          </button>
        )}
      </div>

      {!items ? (
        <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:p-8">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Marke <span className="font-normal normal-case text-zinc-300">(optional)</span>
            </label>
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300">
              <option value="">— Marke auswählen —</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Bestandsdaten einfügen</label>
            <p className="mb-3 text-[11px] leading-relaxed text-zinc-400">
              Format: <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600">MK6356 – 20 Stk – EAN – 16 Stück Aktueller Bestand</code>
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={12}
              placeholder={"MK6356  - 20 Stk - 4053858642355 - 16 Stück Aktueller Bestand\nMK8281  -  7 Stk - 4051432739415 - 6 Stück Aktueller Bestand"}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 font-mono text-[12px] leading-relaxed text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>
          <button onClick={handleAnalyze} disabled={!pasteText.trim() || loading} className="w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-40">
            {loading ? "Wird analysiert…" : "Analyse starten"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-zinc-800">
            {brandLabel && <span className="mr-2 font-medium text-zinc-400">{brandLabel}</span>}
            Bestandsübersicht
            <span className="ml-2 text-sm font-normal text-zinc-400">— {items.length} Modelle</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            <StatCard label="Soll" value={totalSoll} sub="Gezählt" accent />
            <StatCard label="Ist" value={totalIst} sub="Im System" />
            <StatCard label="Abweichung" value={fehlmenge > 0 ? `-${fehlmenge}` : "0"} sub={fehlmenge > 0 ? `${diffs.length} Modelle` : "Alles korrekt"} />
            <StatCard label="Ohne Verpkg." value={ohneVerp.length} sub="Modelle" />
          </div>

          {diffs.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-red-50 bg-red-50 px-5 py-4">
                <span className="text-lg">&#9888;&#65039;</span>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Abweichung – Prüfung erforderlich</p>
                  <p className="text-[11px] text-zinc-400">{diffs.length} Modelle &middot; Fehlmenge: {fehlmenge} Stk</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Modell</th>
                      <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Notiert</th>
                      <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400">System</th>
                      <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Diff</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">EAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffs.map((item, i) => (
                      <tr key={i} className="border-b border-zinc-50 last:border-0 transition-colors hover:bg-red-50/30">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-zinc-900">{item.model}</span>
                          {item.ohneVerpackung && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">ohne Verpkg.</span>}
                        </td>
                        <td className="px-5 py-3.5 text-center font-semibold text-zinc-700">{item.soll}</td>
                        <td className="px-5 py-3.5 text-center font-semibold text-zinc-700">{item.dbQuantity}</td>
                        <td className="px-5 py-3.5 text-center"><DiffBadge diff={item.diff} /></td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">{item.ean || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {unknown.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
                <span className="text-lg">&#127991;&#65039;</span>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Nicht im System gefunden</p>
                  <p className="text-[11px] text-zinc-400">{unknown.length} Modelle</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Modell</th>
                      <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Menge</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">EAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unknown.map((item, i) => (
                      <tr key={i} className="border-b border-zinc-50 last:border-0">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-zinc-900">{item.model}</span>
                          {item.ohneVerpackung && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">ohne Verpkg.</span>}
                        </td>
                        <td className="px-5 py-3.5 text-center font-semibold text-zinc-700">{item.soll}</td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">{item.ean || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {ok.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
                <span className="text-lg">&#9989;</span>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Bestand stimmt überein</p>
                  <p className="text-[11px] text-zinc-400">{ok.length} Modelle</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Modell</th>
                      <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Menge</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">EAN</th>
                      <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ok.map((item, i) => (
                      <tr key={i} className="border-b border-zinc-50 last:border-0 transition-colors hover:bg-zinc-50/50">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-zinc-900">{item.model}</span>
                          {item.ohneVerpackung && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">ohne Verpkg.</span>}
                        </td>
                        <td className="px-5 py-3.5 text-center font-semibold text-zinc-700">{item.soll}</td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">{item.ean || "—"}</td>
                        <td className="px-5 py-3.5 text-center"><DiffBadge diff={0} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
