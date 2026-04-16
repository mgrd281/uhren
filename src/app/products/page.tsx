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

  const filtered = filterBrand
    ? products.filter((p) => p.brand === filterBrand)
    : products;

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

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            Produkte
          </h1>
          <p className="mt-0.5 text-[12px] text-zinc-400">
            {products.length} im Bestand
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={importImages}
            disabled={importingImages}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-all active:scale-95 disabled:opacity-50 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-xl sm:px-3.5 sm:py-2.5"
          >
            <ImagePlus size={17} className={importingImages ? "animate-pulse" : ""} />
            <span className="hidden text-[12px] font-medium sm:inline">
              {importingImages ? "Importiere…" : "Bilder"}
            </span>
          </button>
          <Link
            href="/products/add"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 transition-all active:scale-95 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5"
          >
            <Plus size={18} />
            <span className="hidden text-[13px] font-medium sm:inline">
              Hinzufügen
            </span>
          </Link>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
        <div className="flex min-w-[140px] flex-col rounded-2xl bg-zinc-900 px-4 py-3 text-white">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Bestandswert
          </span>
          <span className="mt-1 text-lg font-bold tracking-tight">
            {formatCurrency(totalValue)}
          </span>
          <span className="mt-0.5 text-[10px] text-zinc-500">
            {totalStock} Stück
          </span>
        </div>
        <div className="flex min-w-[120px] flex-col rounded-2xl bg-white border border-zinc-100 px-4 py-3 shadow-sm">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Umsatz
          </span>
          <span className="mt-1 text-lg font-bold tracking-tight text-zinc-900">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
        <div className="flex min-w-[100px] flex-col rounded-2xl bg-white border border-zinc-100 px-4 py-3 shadow-sm">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Marken
          </span>
          <span className="mt-1 text-lg font-bold tracking-tight text-zinc-900">
            {brands.length}
          </span>
        </div>
      </div>

      {/* ── Search + Filter + View Toggle ── */}
      <div className="flex gap-2">
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
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-[13px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100"
          />
        </div>
        {brands.length > 1 && (
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-[12px] text-zinc-600 outline-none focus:border-zinc-400"
          >
            <option value="">Alle Marken</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}
        <button
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors active:bg-zinc-50"
        >
          {viewMode === "grid" ? <LayoutList size={16} /> : <LayoutGrid size={16} />}
        </button>
      </div>

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
        /* ── Grid View ── */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all active:scale-[0.98] sm:hover:-translate-y-0.5 sm:hover:shadow-lg"
            >
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
                  <div className="absolute left-2 top-2">
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
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {p.brand}
                </p>
                <h3 className="mt-0.5 truncate text-[13px] font-bold text-zinc-900">
                  {p.name}
                </h3>
                <div className="mt-2 flex items-center justify-between">
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
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="rounded-2xl border border-zinc-100 bg-white divide-y divide-zinc-100 overflow-hidden shadow-sm">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-zinc-50"
            >
              {/* Thumbnail */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                {p.mainImage ? (
                  <Image
                    src={p.mainImage}
                    alt={p.name}
                    fill
                    className="object-contain p-1"
                    sizes="48px"
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
                <p className="truncate text-[13px] font-semibold text-zinc-900">
                  {p.name}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  {p.brand} · {p.quantity} Stk.
                  {p._count.sales > 0 && (
                    <span className="text-emerald-600"> · {p._count.sales} verkauft</span>
                  )}
                </p>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <p className="text-[14px] font-bold text-zinc-900">
                  {formatCurrency(p.salePriceExpected)}
                </p>
                {p.status !== "IN_STOCK" && (
                  <span className={cn(
                    "mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                    p.status === "OUT_OF_STOCK"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-600"
                  )}>
                    {p.status === "OUT_OF_STOCK" ? "Ausverkauft" : "Niedrig"}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
