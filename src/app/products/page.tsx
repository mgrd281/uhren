"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui";
import {
  formatCurrency,
  stockStatusLabel,
  stockStatusColor,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/useRole";
import {
  Plus,
  Search,
  Watch,
  ImagePlus,
  Package,
  TrendingUp,
  Filter,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  CheckSquare,
  Square,
  X,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  sku: string;
  category: string;
  costPrice: number;
  salePriceExpected: number;
  quantity: number;
  status: string;
  mainImage: string | null;
  ebayStatus: string;
  kartonAnzahl: number;
  hasBox: boolean;
  _count: { sales: number };
  totalRevenue: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [importingImages, setImportingImages] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterBrand, setFilterBrand] = useState("");
  const { canEdit, canDelete } = useRole();

  /* Bulk edit state */
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkField, setBulkField] = useState<"salePriceExpected" | "costPrice" | "quantity" | "ebayStatus" | "">("");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/products${q}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setProducts(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const totalValue = products.reduce((s, p) => s + p.salePriceExpected * p.quantity, 0);
  const totalStock = products.reduce((s, p) => s + p.quantity, 0);
  const totalRevenue = products.reduce((s, p) => s + p.totalRevenue, 0);
  const brands = [...new Set(products.map((p) => p.brand))].sort();
  const KARTON_BRANDS = ["Michael Kors", "BOSS", "Emporio Armani", "Armani Exchange", "Diesel"];
  const totalKartons = products.filter((p) => KARTON_BRANDS.includes(p.brand)).reduce((s, p) => s + (p.kartonAnzahl || 0), 0);
  const totalBoxes = products.filter((p) => p.hasBox).length;
  const BOX_BRANDS = [
    { brand: "BOSS", label: "BOSS" },
    { brand: "Diesel", label: "Diesel" },
    { brand: "Emporio Armani", label: "Emp. Armani" },
    { brand: "Armani Exchange", label: "Arm. Exchange" },
  ];
  const brandBoxCounts = BOX_BRANDS.map(({ brand, label }) => ({
    brand,
    label,
    count: products.filter((p) => p.brand === brand && p.hasBox).length,
    total: products.filter((p) => p.brand === brand).length,
  })).filter((b) => b.total > 0);

  const filtered = filterBrand
    ? products.filter((p) => p.brand === filterBrand)
    : products;

  // Group filtered products by brand (sorted alphabetically)
  const groupedBrands = [...new Set(filtered.map((p) => p.brand))].sort().map((brand) => ({
    brand,
    items: filtered.filter((p) => p.brand === brand).sort((a, b) => b.quantity - a.quantity),
  }));

  async function importImages() {
    setImportingImages(true);
    try {
      const res = await fetch("/api/import-shopify-all-images", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const updated = data.results?.filter((r: { skipped: boolean }) => !r.skipped).length || 0;
        toast.success(`${data.totalImported} Bilder importiert! ${updated} Produkte aktualisiert`);
        const q = search ? `?search=${encodeURIComponent(search)}` : "";
        fetch(`/api/products${q}${q ? '&' : '?'}_t=${Date.now()}`)
          .then((r) => r.json())
          .then((d) => { if (Array.isArray(d)) setProducts(d); });
      } else {
        toast.error(data.error || "Import fehlgeschlagen");
      }
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setImportingImages(false);
    }
  }

  /* ── Bulk helpers ── */
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  function exitBulkMode() {
    setBulkMode(false);
    setSelected(new Set());
    setBulkField("");
    setBulkValue("");
  }

  async function submitBulk() {
    if (!bulkField || selected.size === 0) return;
    const val = bulkField === "ebayStatus" ? bulkValue : parseFloat(bulkValue);
    if (bulkField !== "ebayStatus" && (isNaN(val as number) || (val as number) < 0)) {
      toast.error("Ungültiger Wert");
      return;
    }
    setBulkSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selected],
          updates: { [bulkField]: val },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.updated} Produkte aktualisiert`);
        exitBulkMode();
        setLoading(true);
        const q = search ? `?search=${encodeURIComponent(search)}` : "";
        fetch(`/api/products${q}`)
          .then((r) => r.json())
          .then((d) => { if (Array.isArray(d)) setProducts(d); })
          .finally(() => setLoading(false));
      } else {
        toast.error(data.error || "Fehler beim Aktualisieren");
      }
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <div className="space-y-5 lg:space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">
            Produkte
          </h1>
          <p className="mt-1 text-[12px] font-medium text-zinc-400 lg:text-sm">
            {products.length} im Bestand
          </p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Bulk edit toggle */}
          {canEdit && products.length > 0 && (
            <button
              onClick={() => bulkMode ? exitBulkMode() : setBulkMode(true)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-xl sm:px-3.5 sm:py-2.5",
                bulkMode
                  ? "bg-amber-100 text-amber-700 lg:hover:bg-amber-200"
                  : "bg-zinc-100 text-zinc-500 lg:hover:bg-zinc-200"
              )}
            >
              {bulkMode ? <X size={17} /> : <Pencil size={17} />}
              <span className="hidden text-[12px] font-medium sm:inline">
                {bulkMode ? "Abbrechen" : "Bulk Edit"}
              </span>
            </button>
          )}
          {canEdit && (
          <button
            onClick={importImages}
            disabled={importingImages}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-all active:scale-95 disabled:opacity-50 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-xl sm:px-3.5 sm:py-2.5 lg:hover:bg-zinc-200"
          >
            <ImagePlus size={17} className={importingImages ? "animate-pulse" : ""} />
            <span className="hidden text-[12px] font-medium sm:inline">
              {importingImages ? "Importiere…" : "Bilder"}
            </span>
          </button>
          )}
          {canEdit && (
          <Link
            href="/products/add"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 transition-all duration-300 active:scale-95 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 lg:hover:shadow-xl lg:hover:shadow-zinc-900/30"
          >
            <Plus size={18} />
            <span className="hidden text-[13px] font-medium sm:inline">
              Hinzufügen
            </span>
          </Link>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
        <div className="flex min-w-[140px] flex-col rounded-2xl bg-zinc-900 px-4 py-3 text-white shadow-lg shadow-zinc-900/20 lg:min-w-0 lg:px-6 lg:py-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 lg:text-xs">
            Bestandswert
          </span>
          <span className="mt-1 text-lg font-bold tracking-tight lg:mt-2 lg:text-2xl">
            {formatCurrency(totalValue)}
          </span>
          <span className="mt-0.5 text-[10px] text-zinc-500 lg:mt-1 lg:text-xs">
            {totalStock} Stück
          </span>
        </div>
        <div className="flex min-w-[120px] flex-col rounded-2xl bg-white dark:bg-zinc-800/60 border border-zinc-100/80 dark:border-zinc-700/40 px-4 py-3 shadow-sm lg:min-w-0 lg:px-6 lg:py-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 lg:text-xs">
            Umsatz
          </span>
          <span className="mt-1 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 lg:mt-2 lg:text-2xl">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
        <div className="flex min-w-[100px] flex-col rounded-2xl bg-white dark:bg-zinc-800/60 border border-zinc-100/80 dark:border-zinc-700/40 px-4 py-3 shadow-sm lg:min-w-0 lg:px-6 lg:py-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 lg:text-xs">
            Marken
          </span>
          <span className="mt-1 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 lg:mt-2 lg:text-2xl">
            {brands.length}
          </span>
        </div>
        {totalKartons > 0 && (
          <div className="flex min-w-[120px] flex-col rounded-2xl bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-800/25 px-4 py-3 shadow-sm lg:min-w-0 lg:px-6 lg:py-5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 dark:text-amber-400 lg:text-xs">
              Kartons gesamt
            </span>
            <span className="mt-1 text-lg font-bold tracking-tight text-amber-700 dark:text-amber-300 lg:mt-2 lg:text-2xl">
              {totalKartons}
            </span>
            <span className="mt-0.5 text-[10px] text-amber-400 dark:text-amber-500 lg:mt-1 lg:text-xs">
              MK · BOSS · Armani · Diesel
            </span>
          </div>
        )}
        <div className="flex min-w-[120px] flex-col rounded-2xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/25 px-4 py-3 shadow-sm lg:min-w-0 lg:px-6 lg:py-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 lg:text-xs">
            Mit Box
          </span>
          <span className="mt-1 text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-300 lg:mt-2 lg:text-2xl">
            {totalBoxes}
          </span>
          <span className="mt-0.5 text-[10px] text-emerald-400 dark:text-emerald-500 lg:mt-1 lg:text-xs">
            Original-Box vorhanden
          </span>
        </div>
        {brandBoxCounts.map(({ brand, label, count, total }) => (
          <div key={brand} className="flex min-w-[110px] flex-col rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 px-4 py-3 shadow-sm lg:min-w-0 lg:px-6 lg:py-5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 lg:text-xs">
              {label}
            </span>
            <span className="mt-1 text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-300 lg:mt-2 lg:text-2xl">
              {count}
            </span>
            <span className="mt-0.5 text-[10px] text-emerald-400 dark:text-emerald-500 lg:mt-1 lg:text-xs">
              von {total} mit Box
            </span>
          </div>
        ))}
      </div>

      {/* ── Search + View Toggle ── */}
      <div className="flex gap-2 lg:gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Suchen…"
            value={search}
            onChange={(e) => {
              setLoading(true);
              setSearch(e.target.value);
            }}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-[13px] text-zinc-900 outline-none transition-all duration-200 placeholder:text-zinc-300 focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 hover:border-zinc-300 lg:h-12 lg:text-sm"
          />
        </div>
        <button
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors active:bg-zinc-50 lg:h-12 lg:w-12 lg:hover:bg-zinc-50"
        >
          {viewMode === "grid" ? <LayoutList size={16} /> : <LayoutGrid size={16} />}
        </button>
      </div>

      {/* ── Brand chips ── */}
      {brands.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
          <button
            onClick={() => setFilterBrand("")}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all active:scale-95",
              filterBrand === ""
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800"
            )}
          >
            Alle
          </button>
          {brands.map((b) => {
            const revenue = products.filter((p) => p.brand === b).reduce((s, p) => s + p.totalRevenue, 0);
            return (
              <button
                key={b}
                onClick={() => setFilterBrand(filterBrand === b ? "" : b)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all active:scale-95",
                  filterBrand === b
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                )}
              >
                {b}
                <span className={cn(
                  "ml-1.5 text-[10px] font-medium",
                  filterBrand === b ? "text-zinc-300" : "text-zinc-400"
                )}>
                  {revenue > 0 ? formatCurrency(revenue) : "—"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Bulk Action Panel ── */}
      {bulkMode && (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          {/* Select all / count */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[13px] font-semibold text-amber-800 transition-colors active:text-amber-900"
            >
              {selected.size === filtered.length && filtered.length > 0 ? (
                <CheckSquare size={18} className="text-amber-600" />
              ) : (
                <Square size={18} className="text-amber-400" />
              )}
              {selected.size > 0
                ? `${selected.size} von ${filtered.length} ausgewählt`
                : "Alle auswählen"}
            </button>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="text-[11px] font-medium text-amber-600 active:text-amber-800"
              >
                Auswahl aufheben
              </button>
            )}
          </div>

          {/* Field + Value + Apply */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[140px] flex-1">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700">Feld</p>
                <select
                  value={bulkField}
                  onChange={(e) => { setBulkField(e.target.value as typeof bulkField); setBulkValue(""); }}
                  className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-[13px] text-zinc-900 outline-none focus:ring-2 focus:ring-amber-200"
                >
                  <option value="">Auswählen…</option>
                  <option value="salePriceExpected">Verkaufspreis (€)</option>
                  <option value="costPrice">Einkaufspreis (€)</option>
                  <option value="quantity">Bestand</option>
                  <option value="ebayStatus">eBay-Status</option>
                </select>
              </div>

              {bulkField && (
                <div className="min-w-[120px] flex-1">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700">Neuer Wert</p>
                  {bulkField === "ebayStatus" ? (
                    <select
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-[13px] text-zinc-900 outline-none focus:ring-2 focus:ring-amber-200"
                    >
                      <option value="">Auswählen…</option>
                      <option value="Nicht gepostet">Nicht gepostet</option>
                      <option value="Aktiv">Aktiv</option>
                      <option value="Verkauft">Verkauft</option>
                      <option value="Pausiert">Pausiert</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step={bulkField === "quantity" ? "1" : "0.01"}
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      placeholder={bulkField === "quantity" ? "z.B. 5" : "z.B. 299.00"}
                      className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-300 focus:ring-2 focus:ring-amber-200"
                    />
                  )}
                </div>
              )}

              {bulkField && bulkValue && (
                <button
                  onClick={submitBulk}
                  disabled={bulkSaving}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-bold transition-all",
                    bulkSaving
                      ? "bg-amber-300 text-amber-700"
                      : "bg-amber-600 text-white shadow-md active:scale-95 lg:hover:bg-amber-700"
                  )}
                >
                  {bulkSaving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Pencil size={14} />
                  )}
                  {selected.size} aktualisieren
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Product List ── */}
      {loading ? (
        <div className={cn(
          "gap-3",
          viewMode === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            : "space-y-2"
        )}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={viewMode === "grid" ? "h-64" : "h-20"} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
            <Watch size={28} className="text-zinc-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-700">
            Keine Produkte
          </h3>
          <p className="mt-1 text-[12px] text-zinc-400">
            Fügen Sie Ihre erste Uhr hinzu
          </p>
          <Link
            href="/products/add"
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg shadow-zinc-900/20 transition-all active:scale-95"
          >
            <Plus size={16} />
            Produkt hinzufügen
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid View (grouped by brand) ── */
        <div className="space-y-8">
          {groupedBrands.map(({ brand, items }) => (
            <div key={brand}>
              {/* Brand header */}
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-zinc-900 lg:text-base">
                  {brand}
                </h2>
                <span className="text-[11px] font-medium text-zinc-400">
                  {items.length} {items.length === 1 ? "Produkt" : "Produkte"}
                </span>
                <div className="h-px flex-1 bg-zinc-100" />
              </div>
              {/* Products grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
                {items.map((p) => {
                  const isSelected = selected.has(p.id);
                  const cardClass = cn(
                    "group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all active:scale-[0.98] sm:hover:-translate-y-0.5 sm:hover:shadow-lg lg:hover:shadow-xl cursor-pointer",
                    bulkMode && isSelected
                      ? "border-amber-400 ring-2 ring-amber-200"
                      : "border-zinc-100"
                  );
                  const cardContent = (
                    <>
                    {/* Bulk checkbox overlay */}
                    {bulkMode && (
                      <div className="absolute left-2 top-2 z-10">
                        {isSelected ? (
                          <CheckSquare size={22} className="text-amber-600 drop-shadow" />
                        ) : (
                          <Square size={22} className="text-zinc-300 drop-shadow" />
                        )}
                      </div>
                    )}
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-zinc-50">
                      {p.mainImage ? (
                        <Image
                          src={p.mainImage}
                          alt={p.name}
                          fill
                          className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          unoptimized={p.mainImage.startsWith("data:") || p.mainImage.startsWith("http")}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Watch size={32} className="text-zinc-200" />
                        </div>
                      )}
                      {/* Status pill */}
                      {p.status !== "IN_STOCK" && (
                        <div className={cn("absolute top-2", bulkMode ? "left-8" : "left-2")}>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                            p.status === "OUT_OF_STOCK"
                              ? "bg-red-500 text-white"
                              : "bg-amber-400 text-amber-900"
                          )}>
                            {p.status === "OUT_OF_STOCK" ? "Ausverkauft" : "Niedrig"}
                          </span>
                        </div>
                      )}
                      {p.quantity > 0 && (
                        <div className="absolute right-2 top-2">
                          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-zinc-700 shadow-sm backdrop-blur-sm">
                            {p.quantity}×
                          </span>
                        </div>
                      )}
                      {["Michael Kors", "BOSS", "Emporio Armani", "Armani Exchange", "Diesel"].includes(p.brand) && p.kartonAnzahl > 0 && (
                        <div className="absolute bottom-2 right-2">
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 shadow-sm">
                            📦 {p.kartonAnzahl}
                          </span>
                        </div>
                      )}
                      {p.hasBox && (
                        <div className="absolute bottom-2 left-2">
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 shadow-sm">
                            📦 Box
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="truncate text-[13px] font-bold text-zinc-900">
                        {p.name}
                      </h3>
                      <div className="mt-1.5 flex items-center justify-between gap-1">
                        <span className="text-[15px] font-black tracking-tight text-zinc-900">
                          {formatCurrency(p.salePriceExpected)}
                        </span>
                        {p._count.sales > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                            <TrendingUp size={10} />
                            {p._count.sales}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5">
                        <span className={cn(
                          "inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold",
                          p.ebayStatus === "eBay Kleinanzeigen" || p.ebayStatus === "eBay Kleinanzeige"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-zinc-100 text-zinc-400"
                        )}>
                          {p.ebayStatus === "eBay Kleinanzeigen" || p.ebayStatus === "eBay Kleinanzeige" ? "eBay Kleinanzeige" : "Nicht gepostet"}
                        </span>
                      </div>
                    </div>
                    </>
                  );
                  return bulkMode ? (
                    <div key={p.id} onClick={() => toggleSelect(p.id)} role="button" className={cardClass}>
                      {cardContent}
                    </div>
                  ) : (
                    <Link key={p.id} href={`/products/${p.id}`} className={cardClass}>
                      {cardContent}
                    </Link>
                  );
                })}
              </div>
              {/* Karton summary card per brand */}
              {(() => {
                const brandKartons = items.reduce((s, p) => s + (p.kartonAnzahl || 0), 0);
                if (!KARTON_BRANDS.includes(brand) || brandKartons === 0) return null;
                return (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3.5">
                    <span className="text-xl">📦</span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">Kartons</p>
                      <p className="text-2xl font-black tracking-tight text-amber-700">{brandKartons}</p>
                    </div>
                    <p className="ml-2 text-[11px] text-amber-400">Wird nicht im Bestand gezählt</p>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="rounded-2xl border border-zinc-100 bg-white divide-y divide-zinc-100 overflow-hidden shadow-sm">
          {/* Desktop table header */}
          <div className="hidden items-center gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 lg:flex">
            {bulkMode && <div className="w-6 shrink-0" />}
            <div className="w-12 shrink-0" />
            <div className="flex-1">Produkt</div>
            <div className="w-20 text-center">Bestand</div>
            <div className="w-20 text-center">Verkäufe</div>
            <div className="w-28 text-right">Preis</div>
          </div>
          {filtered.map((p) => {
            const isSelected = selected.has(p.id);
            const rowClass = cn(
              "flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-zinc-50 lg:gap-4 lg:px-5 lg:py-4 lg:hover:bg-zinc-50 cursor-pointer",
              bulkMode && isSelected && "bg-amber-50"
            );
            const rowContent = (
              <>
              {/* Bulk checkbox */}
              {bulkMode && (
                <div className="shrink-0">
                  {isSelected ? (
                    <CheckSquare size={20} className="text-amber-600" />
                  ) : (
                    <Square size={20} className="text-zinc-300" />
                  )}
                </div>
              )}
              {/* Thumbnail */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100 lg:h-14 lg:w-14">
                {p.mainImage ? (
                  <Image
                    src={p.mainImage}
                    alt={p.name}
                    fill
                    className="object-contain p-1"
                    sizes="56px"
                    unoptimized={p.mainImage.startsWith("data:") || p.mainImage.startsWith("http")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Watch size={20} className="text-zinc-300" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-zinc-900 lg:text-sm">
                  {p.name}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400 lg:text-xs">
                  {p.brand}
                  <span className="lg:hidden"> · {p.quantity} Stk.</span>
                  {p._count.sales > 0 && (
                    <span className="text-emerald-600 lg:hidden"> · {p._count.sales} verkauft</span>
                  )}
                </p>
              </div>

              {/* Desktop: Stock column */}
              <div className="hidden w-20 text-center lg:block">
                <span className={cn(
                  "inline-block rounded-full px-2.5 py-1 text-[11px] font-bold",
                  p.status === "OUT_OF_STOCK"
                    ? "bg-red-100 text-red-600"
                    : p.status === "LOW_STOCK"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-zinc-100 text-zinc-600"
                )}>
                  {p.quantity} Stk.
                </span>
              </div>

              {/* Desktop: Sales column */}
              <div className="hidden w-20 text-center lg:block">
                {p._count.sales > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600">
                    <TrendingUp size={12} />
                    {p._count.sales}
                  </span>
                ) : (
                  <span className="text-[12px] text-zinc-300">—</span>
                )}
              </div>

              {/* Price */}
              <div className="text-right shrink-0 lg:w-28">
                <p className="text-[14px] font-bold text-zinc-900 lg:text-base">
                  {formatCurrency(p.salePriceExpected)}
                </p>
                {p.status !== "IN_STOCK" && (
                  <span className={cn(
                    "mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold lg:hidden",
                    p.status === "OUT_OF_STOCK"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-600"
                  )}>
                    {p.status === "OUT_OF_STOCK" ? "Ausverkauft" : "Niedrig"}
                  </span>
                )}
              </div>
              </>
            );
            return bulkMode ? (
              <div key={p.id} onClick={() => toggleSelect(p.id)} role="button" className={rowClass}>
                {rowContent}
              </div>
            ) : (
              <Link key={p.id} href={`/products/${p.id}`} className={rowClass}>
                {rowContent}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
