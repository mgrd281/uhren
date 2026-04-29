"use client";

import { useState, useEffect } from "react";

interface DBProduct {
  id: string;
  model: string;
  brand: string;
  quantity: number;
  sku: string;
}

interface PastedItem {
  model: string;
  quantity: number;
  ean: string;
}

interface MatchItem extends PastedItem {
  dbQuantity: number;
}

interface DiscrepancyItem extends PastedItem {
  dbQuantity: number;
  diff: number;
}

interface CompareResult {
  brand: string;
  matching: MatchItem[];
  discrepancies: DiscrepancyItem[];
  ohneEtikett: PastedItem[];
  totalSoll: number;
  totalIst: number;
}

function parsePastedText(text: string): PastedItem[] {
  const results: PastedItem[] = [];

  // Step 1: Normalize — remove known header/label words and "Stk" suffix
  const normalized = text
    .replace(/Modell|Menge|EAN|Notiert|Aktueller Bestand|Differenz|Bestandscheck|Bestandsübersicht|Bestand stimmt überein|Abweichung|Ohne Etikett|Zusammenfassung|Prüfung erforderlich/gi, " ")
    .replace(/[✅⚠️🏷️📊]/gu, " ")
    .replace(/\s*Stk\s*/gi, " ")
    .replace(/[\r\n]+/g, " ")
    .trim();

  // Step 2: Use regex to extract items: model (letters+digits), quantity (number), optional EAN (10-14 digits)
  // Pattern: 1-4 uppercase letters followed by 3-6 digits = model number
  const pattern = /([A-Z]{1,4}\d{3,6})\D{0,4}?(\d{1,4})(?:\D{0,4}?(\d{10,14}))?/g;

  let match;
  while ((match = pattern.exec(normalized)) !== null) {
    const model = match[1].toUpperCase();
    const quantity = parseInt(match[2], 10) || 0;
    const ean = match[3] ?? "";
    // Sanity check: avoid false positives (qty should be reasonable, model shouldn't be an EAN)
    if (model.length >= 4 && quantity <= 9999 && model.length <= 10) {
      results.push({ model, quantity, ean });
    }
  }

  // Fallback: if regex found nothing, try line-by-line
  if (results.length === 0) {
    for (const line of text.split("\n")) {
      const clean = line.trim();
      if (!clean) continue;
      const parts = clean.split(/[\t;,]|\s+/).filter(Boolean);
      if (parts.length < 2) continue;
      const model = parts[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
      const quantity = parseInt(parts[1].replace(/[^0-9]/g, ""), 10) || 0;
      const ean = parts[2] ?? "";
      if (model.length >= 3) results.push({ model, quantity, ean });
    }
  }

  return results;
}

export default function InventoryPage() {
  const [brands, setBrands] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);

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
    if (!brand || !pasteText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/products?brand=${encodeURIComponent(brand)}`);
      const dbProducts: DBProduct[] = await res.json();

      const pastedItems = parsePastedText(pasteText);

      const matching: MatchItem[] = [];
      const discrepancies: DiscrepancyItem[] = [];
      const ohneEtikett: PastedItem[] = [];

      for (const item of pastedItems) {
        const dbProduct = dbProducts.find(
          (p) => p.model.toUpperCase().replace(/[^A-Z0-9]/g, "") === item.model
        );
        if (!dbProduct) {
          // Not found in DB → Ohne Etikett
          ohneEtikett.push(item);
        } else if (dbProduct.quantity === item.quantity) {
          matching.push({ ...item, dbQuantity: dbProduct.quantity });
        } else {
          discrepancies.push({
            ...item,
            dbQuantity: dbProduct.quantity,
            diff: dbProduct.quantity - item.quantity,
          });
        }
      }

      const totalSoll = pastedItems.reduce((s, i) => s + i.quantity, 0);
      const totalIst = dbProducts.reduce((s, p) => s + p.quantity, 0);

      setResult({ brand, matching, discrepancies, ohneEtikett, totalSoll, totalIst });
    } catch {
      alert("Fehler beim Laden der Produkte.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setPasteText("");
    setBrand("");
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Bestandscheck</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Vergleiche deine gezählten Bestände mit dem System
          </p>
        </div>

        {!result ? (
          /* Input Form */
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* Brand selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Marke auswählen
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                <option value="">— Marke auswählen —</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Paste area */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Bestandsdaten einfügen
              </label>
              <p className="mb-2 text-xs text-zinc-400">
                Format: Modell → Menge → EAN (Tab-/leerzeichen-getrennt, eine Zeile pro Artikel)
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={10}
                placeholder={"MK6356\t16\t4053858642355\nMK5896\t9\t4053858190078\nMK5354\t8"}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={!brand || !pasteText.trim() || loading}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40"
            >
              {loading ? "Wird analysiert…" : "Analyse starten"}
            </button>
          </div>
        ) : (
          /* Results */
          <div className="space-y-6">
            {/* Brand header + reset */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">
                {result.brand} – Bestandsübersicht
              </h2>
              <button
                onClick={handleReset}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
              >
                Neue Analyse
              </button>
            </div>

            {/* ✅ Matching */}
            {result.matching.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-zinc-100 px-5 py-4">
                  <h3 className="text-base font-bold text-zinc-900">
                    ✅ Bestand stimmt überein
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="px-5 py-3 text-left font-semibold text-zinc-500">Modell</th>
                        <th className="px-5 py-3 text-left font-semibold text-zinc-500">Menge</th>
                        <th className="px-5 py-3 text-left font-semibold text-zinc-500">EAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.matching.map((item, i) => (
                        <tr key={i} className="border-b border-zinc-50 last:border-0">
                          <td className="px-5 py-3 font-medium text-zinc-900">{item.model}</td>
                          <td className="px-5 py-3 text-zinc-600">{item.quantity} Stk</td>
                          <td className="px-5 py-3 font-mono text-zinc-400">{item.ean || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ⚠️ Abweichung */}
            {result.discrepancies.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-amber-100 bg-amber-50 px-5 py-4">
                  <h3 className="text-base font-bold text-zinc-900">
                    ⚠️ Abweichung – Prüfung erforderlich
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="px-5 py-3 text-left font-semibold text-zinc-500">Modell</th>
                        <th className="px-5 py-3 text-left font-semibold text-zinc-500">Notiert</th>
                        <th className="px-5 py-3 text-left font-semibold text-zinc-500">Aktueller Bestand</th>
                        <th className="px-5 py-3 text-left font-semibold text-zinc-500">Differenz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.discrepancies.map((item, i) => (
                        <tr key={i} className="border-b border-zinc-50 last:border-0">
                          <td className="px-5 py-3 font-medium text-zinc-900">{item.model}</td>
                          <td className="px-5 py-3 text-zinc-600">{item.quantity} Stk</td>
                          <td className="px-5 py-3 text-zinc-600">{item.dbQuantity} Stk</td>
                          <td className="px-5 py-3 font-semibold text-red-600">
                            {item.diff > 0 ? `+${item.diff}` : item.diff}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 🏷️ Ohne Etikett */}
            {result.ohneEtikett.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-zinc-100 px-5 py-4">
                  <h3 className="text-base font-bold text-zinc-900">
                    🏷️ Ohne Etikett
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-400">Nicht im System gefunden</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="px-5 py-3 text-left font-semibold text-zinc-500">Modell</th>
                        <th className="px-5 py-3 text-left font-semibold text-zinc-500">Menge</th>
                        <th className="px-5 py-3 text-left font-semibold text-zinc-500">EAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.ohneEtikett.map((item, i) => (
                        <tr key={i} className="border-b border-zinc-50 last:border-0">
                          <td className="px-5 py-3 font-medium text-zinc-900">{item.model}</td>
                          <td className="px-5 py-3 text-zinc-600">{item.quantity} Stk</td>
                          <td className="px-5 py-3 font-mono text-zinc-400">{item.ean || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 📊 Zusammenfassung */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h3 className="text-base font-bold text-zinc-900">📊 Zusammenfassung</h3>
              </div>
              <div className="px-5 py-4 space-y-2 text-sm text-zinc-700">
                <div className="flex justify-between">
                  <span>Modelle gesamt:</span>
                  <span className="font-semibold text-zinc-900">
                    {result.matching.length + result.discrepancies.length + result.ohneEtikett.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stückzahl gesamt (Soll):</span>
                  <span className="font-semibold text-zinc-900">{result.totalSoll} Stk</span>
                </div>
                <div className="flex justify-between">
                  <span>Stückzahl aktuell (Ist):</span>
                  <span className="font-semibold text-zinc-900">{result.totalIst} Stk</span>
                </div>
                {result.discrepancies.length > 0 && (
                  <div className="flex justify-between border-t border-zinc-100 pt-2">
                    <span className="text-amber-600 font-medium">Fehlmenge:</span>
                    <span className="font-semibold text-amber-600">
                      {Math.abs(result.discrepancies.reduce((s, i) => s + i.diff, 0))} Stk
                      {" "}({result.discrepancies.map((i) => i.model).join(", ")})
                    </span>
                  </div>
                )}
                {result.ohneEtikett.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ohne Systemeintrag:</span>
                    <span className="font-semibold text-zinc-700">{result.ohneEtikett.length} Modelle</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
