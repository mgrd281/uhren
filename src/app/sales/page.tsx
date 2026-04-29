"use client";

import { useEffect, useState, useRef } from "react";
import {
  Button,
  Input,
  Textarea,
  Skeleton,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  X,
  ShoppingBag,
  Search,
  ArrowUpRight,
  CreditCard,
  Banknote,
  Gift,
  Check,
  Watch,
  ChevronDown,
  Minus,
  Package,
  SlidersHorizontal,
  Calendar,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/useRole";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

const PAYMENT_METHODS = [
  { key: "Bar", label: "Bar", icon: Banknote },
  { key: "PayPal", label: "PayPal", icon: CreditCard },
  { key: "Überweisung", label: "Überw.", icon: CreditCard },
  { key: "Geschenk", label: "Geschenk", icon: Gift },
];
const MARKETPLACES = [
  { key: "Shopify", label: "Shopify" },
  { key: "Kaufland", label: "Kaufland" },
  { key: "eBay Kleinanzeigen", label: "eBay KA" },
];

interface Sale {
  id: string;
  productId: string;
  quantitySold: number;
  salePrice: number;
  totalAmount: number;
  customerName: string | null;
  invoiceNumber: string | null;
  soldAt: string;
  notes: string | null;
  paymentMethod?: string | null;
  marketplace?: string | null;
  product: { name: string; brand: string; quantity: number; mainImage?: string | null };
}

interface Product {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  salePriceExpected: number;
  mainImage?: string | null;
  model?: string;
}

/* ─── Group sales by date ─── */
function groupByDate(sales: Sale[]): { label: string; sales: Sale[] }[] {
  const groups: Record<string, Sale[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const sale of sales) {
    const d = new Date(sale.soldAt).toDateString();
    let label: string;
    if (d === today) label = "Heute";
    else if (d === yesterday) label = "Gestern";
    else
      label = new Date(sale.soldAt).toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    if (!groups[label]) groups[label] = [];
    groups[label].push(sale);
  }
  return Object.entries(groups).map(([label, sales]) => ({ label, sales }));
}

/* ─── Product Image Component ─── */
function ProductThumb({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) {
  if (src) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-zinc-100" style={{ width: size, height: size }}>
        <Image src={src} alt={name} fill className="object-cover" sizes={`${size}px`} />
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-zinc-100"
      style={{ width: size, height: size }}
    >
      <Watch size={size * 0.45} className="text-zinc-300" />
    </div>
  );
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMarketplace, setFilterMarketplace] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "today" | "7d" | "30d">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { canEdit } = useRole();

  /* Form state */
  const [formStep, setFormStep] = useState<"product" | "details">("product");
  const [productSearch, setProductSearch] = useState("");
  const [form, setForm] = useState({
    productId: "",
    quantitySold: 1,
    salePrice: "",
    customerName: "",
    invoiceNumber: "",
    notes: "",
    paymentMethod: "",
    marketplace: "",
  });
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/sales").then((r) => r.json()).catch(() => []),
      fetch("/api/products").then((r) => r.json()).catch(() => []),
    ])
      .then(([s, p]) => {
        if (Array.isArray(s)) setSales(s);
        if (Array.isArray(p)) setProducts(p);
      })
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm({
      productId: "",
      quantitySold: 1,
      salePrice: "",
      customerName: "",
      invoiceNumber: "",
      notes: "",
      paymentMethod: "",
      marketplace: "",
    });
    setFormStep("product");
    setProductSearch("");
    setShowNotes(false);
  }

  function selectProduct(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setForm((prev) => ({
      ...prev,
      productId,
      salePrice: String(p.salePriceExpected),
    }));
    setFormStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      productId: form.productId,
      quantitySold: form.quantitySold,
      salePrice: parseFloat(form.salePrice),
      customerName: form.customerName || null,
      invoiceNumber: form.invoiceNumber || null,
      paymentMethod: form.paymentMethod || null,
      marketplace: form.marketplace || null,
      notes: form.notes || null,
    };

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Verkauf fehlgeschlagen");
        setSaving(false);
        return;
      }

      toast.success("Verkauf erfolgreich erfasst");
      setShowForm(false);
      resetForm();

      const [s, p] = await Promise.all([
        fetch("/api/sales").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
      ]);
      setSales(s);
      setProducts(p);
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setSaving(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === form.productId);

  async function handleDelete(saleId: string) {
    if (!confirm("Verkauf wirklich löschen?")) return;
    setDeletingId(saleId);
    try {
      const res = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Verkauf gelöscht");
      setSales((prev) => prev.filter((s) => s.id !== saleId));
    } catch {
      toast.error("Löschen fehlgeschlagen");
    } finally {
      setDeletingId(null);
    }
  }

  const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const totalItems = sales.reduce((s, x) => s + x.quantitySold, 0);
  const totalAmount = form.salePrice ? form.quantitySold * parseFloat(form.salePrice) : 0;

  /* Available products for picker */
  const availableProducts = products.filter((p) => {
    if (p.quantity <= 0) return false;
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.model && p.model.toLowerCase().includes(q))
    );
  });

  /* Filtered sales list */
  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.product.name.toLowerCase().includes(q) ||
      s.product.brand.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(q)) ||
      (s.marketplace && s.marketplace.toLowerCase().includes(q));
    const matchMarket =
      !filterMarketplace || s.marketplace === filterMarketplace;
    const matchPayment =
      !filterPayment || s.paymentMethod === filterPayment;
    let matchPeriod = true;
    if (filterPeriod !== "all") {
      const saleDate = new Date(s.soldAt);
      const now = new Date();
      if (filterPeriod === "today") {
        matchPeriod = saleDate.toDateString() === now.toDateString();
      } else if (filterPeriod === "7d") {
        matchPeriod = now.getTime() - saleDate.getTime() <= 7 * 86400000;
      } else if (filterPeriod === "30d") {
        matchPeriod = now.getTime() - saleDate.getTime() <= 30 * 86400000;
      }
    }
    return matchSearch && matchMarket && matchPayment && matchPeriod;
  });
  const grouped = groupByDate(filtered);
  const saleIndexMap = new Map(filtered.map((s, i) => [s.id, i + 1]));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            Verkäufe
          </h1>
          <p className="mt-1 text-[12px] font-medium text-zinc-400">
            {sales.length} Transaktionen
          </p>
        </div>
        {canEdit && (
        <button
          onClick={() => {
            if (showForm) resetForm();
            setShowForm(!showForm);
          }}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5",
            showForm
              ? "bg-zinc-200 text-zinc-700"
              : "bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 active:scale-95 lg:hover:shadow-xl lg:hover:shadow-zinc-900/30"
          )}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          <span className="hidden text-[13px] font-medium sm:inline">
            {showForm ? "Abbrechen" : "Neuer Verkauf"}
          </span>
        </button>
        )}
      </div>

      {/* ── Revenue Summary Cards ── */}
      {!showForm && (
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col rounded-2xl bg-zinc-900 px-3.5 py-3 text-white shadow-lg shadow-zinc-900/20">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Umsatz
            </span>
            <span className="mt-1 text-[16px] font-bold tracking-tight sm:text-lg">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="mt-0.5 text-[9px] text-zinc-500">
              {totalItems} Stück
            </span>
          </div>
          <div className="flex flex-col rounded-2xl border border-zinc-100/80 bg-white px-3.5 py-3 shadow-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Ø Verkauf
            </span>
            <span className="mt-1 text-[16px] font-bold tracking-tight text-zinc-900 sm:text-lg">
              {sales.length > 0 ? formatCurrency(totalRevenue / sales.length) : "–"}
            </span>
          </div>
          <div className="flex flex-col rounded-2xl border border-zinc-100 bg-white px-3.5 py-3 shadow-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Monat
            </span>
            <span className="mt-1 text-[16px] font-bold tracking-tight text-zinc-900 sm:text-lg">
              {formatCurrency(
                sales
                  .filter((s) => {
                    const d = new Date(s.soldAt);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum, s) => sum + s.totalAmount, 0)
              )}
            </span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── NEW SALE FORM ── */}
      {/* ══════════════════════════════════════════════════════ */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Step 1: Product Picker ── */}
          {formStep === "product" && (
            <div className="space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Uhr suchen…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  autoFocus
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-4 text-[14px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100"
                />
              </div>

              {/* Product grid */}
              <div className="space-y-2">
                {availableProducts.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Package size={32} className="mb-2 text-zinc-300" />
                    <p className="text-[13px] text-zinc-400">Keine Produkte verfügbar</p>
                  </div>
                ) : (
                  availableProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProduct(p.id)}
                      className="flex w-full items-center gap-3.5 rounded-2xl border border-zinc-100 bg-white p-3 text-left shadow-sm transition-all active:scale-[0.98] active:bg-zinc-50"
                    >
                      <ProductThumb src={p.mainImage} name={p.name} size={56} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                          {p.brand}
                        </p>
                        <p className="mt-0.5 truncate text-[14px] font-bold text-zinc-900">
                          {p.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-zinc-700">
                            {formatCurrency(p.salePriceExpected)}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            · {p.quantity} verfügbar
                          </span>
                        </div>
                      </div>
                      <ChevronDown size={16} className="-rotate-90 text-zinc-300" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Sale Details ── */}
          {formStep === "details" && selectedProduct && (
            <div className="space-y-4">
              {/* Selected product card */}
              <div className="flex items-center gap-3.5 rounded-2xl bg-zinc-900 p-3.5">
                <ProductThumb src={selectedProduct.mainImage} name={selectedProduct.name} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {selectedProduct.brand}
                  </p>
                  <p className="mt-0.5 truncate text-[14px] font-bold text-white">
                    {selectedProduct.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormStep("product");
                    setForm((prev) => ({ ...prev, productId: "" }));
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors active:bg-white/20"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Quantity stepper + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-2 text-[12px] font-medium text-zinc-500">Menge</p>
                  <div className="flex h-12 items-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, quantitySold: Math.max(1, prev.quantitySold - 1) }))}
                      className="flex h-full w-12 items-center justify-center text-zinc-400 transition-colors active:bg-zinc-100"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center text-[16px] font-bold text-zinc-900">
                      {form.quantitySold}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          quantitySold: Math.min(selectedProduct.quantity, prev.quantitySold + 1),
                        }))
                      }
                      className="flex h-full w-12 items-center justify-center text-zinc-400 transition-colors active:bg-zinc-100"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-medium text-zinc-500">Preis (€)</p>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salePrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, salePrice: e.target.value }))}
                    required
                    className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-[16px] font-bold text-zinc-900 outline-none transition-all focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <p className="mb-2 text-[12px] font-medium text-zinc-500">Zahlung</p>
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          paymentMethod: prev.paymentMethod === m.key ? "" : m.key,
                        }))
                      }
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-[12px] font-medium transition-all",
                        form.paymentMethod === m.key
                          ? "bg-zinc-900 text-white shadow-md"
                          : "bg-zinc-100 text-zinc-500 active:bg-zinc-200"
                      )}
                    >
                      <m.icon size={15} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Marketplace */}
              <div>
                <p className="mb-2 text-[12px] font-medium text-zinc-500">Plattform</p>
                <div className="flex gap-2">
                  {MARKETPLACES.map((mp) => (
                    <button
                      key={mp.key}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          marketplace: prev.marketplace === mp.key ? "" : mp.key,
                        }))
                      }
                      className={cn(
                        "flex-1 rounded-xl py-3 text-[12px] font-medium transition-all",
                        form.marketplace === mp.key
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-zinc-100 text-zinc-500 active:bg-zinc-200"
                      )}
                    >
                      {mp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer & Invoice */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-2 text-[12px] font-medium text-zinc-500">Kunde</p>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.customerName}
                    onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-300 focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100"
                  />
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-medium text-zinc-500">Rechnungsnr.</p>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.invoiceNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-300 focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100"
                  />
                </div>
              </div>

              {/* Notes toggle */}
              {!showNotes ? (
                <button
                  type="button"
                  onClick={() => setShowNotes(true)}
                  className="text-[12px] font-medium text-zinc-400 transition-colors active:text-zinc-600"
                >
                  + Notizen hinzufügen
                </button>
              ) : (
                <div>
                  <p className="mb-2 text-[12px] font-medium text-zinc-500">Notizen</p>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-300 focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100"
                    placeholder="Anmerkungen…"
                    autoFocus
                  />
                </div>
              )}

              {/* Total + Submit */}
              <div className="space-y-3 pt-1">
                {form.salePrice && (
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-5 py-4">
                    <span className="text-[13px] font-medium text-zinc-500">Gesamt</span>
                    <span className="text-2xl font-black tracking-tight text-zinc-900">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || !form.salePrice}
                  className={cn(
                    "flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold transition-all",
                    saving || !form.salePrice
                      ? "bg-zinc-200 text-zinc-400"
                      : "bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 active:scale-[0.98]"
                  )}
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Wird erfasst…
                    </>
                  ) : (
                    <>
                      <Check size={18} strokeWidth={3} />
                      Verkauf erfassen
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ── Search & Filter ── */}
      {!showForm && sales.length > 0 && (
        <div className="space-y-2.5">
          {/* Search row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Name, Marke, Kunde, Rechnung…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-[13px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-300 transition-colors hover:text-zinc-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all",
                showFilters || filterMarketplace || filterPayment || filterPeriod !== "all"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-400"
              )}
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {/* Period pills (always visible) */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {([
              { key: "all", label: "Alle" },
              { key: "today", label: "Heute" },
              { key: "7d", label: "7 Tage" },
              { key: "30d", label: "30 Tage" },
            ] as const).map((p) => (
              <button
                key={p.key}
                onClick={() => setFilterPeriod(filterPeriod === p.key ? "all" : p.key)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                  filterPeriod === p.key
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-500 active:bg-zinc-200"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Expandable filters */}
          {showFilters && (
            <div className="space-y-2.5 rounded-2xl border border-zinc-100 bg-white p-3.5 shadow-sm">
              {/* Marketplace filter */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Plattform</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterMarketplace("")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                      !filterMarketplace
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-500 active:bg-zinc-200"
                    )}
                  >
                    Alle
                  </button>
                  {["Shopify", "Kaufland", "eBay Kleinanzeigen"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setFilterMarketplace(filterMarketplace === m ? "" : m)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                        filterMarketplace === m
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-100 text-zinc-500 active:bg-zinc-200"
                      )}
                    >
                      {m === "eBay Kleinanzeigen" ? "eBay KA" : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method filter */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Zahlung</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterPayment("")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                      !filterPayment
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-500 active:bg-zinc-200"
                    )}
                  >
                    Alle
                  </button>
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setFilterPayment(filterPayment === m.key ? "" : m.key)}
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                        filterPayment === m.key
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-500 active:bg-zinc-200"
                      )}
                    >
                      <m.icon size={12} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear all filters */}
              {(filterMarketplace || filterPayment || filterPeriod !== "all") && (
                <button
                  onClick={() => {
                    setFilterMarketplace("");
                    setFilterPayment("");
                    setFilterPeriod("all");
                  }}
                  className="text-[11px] font-medium text-red-500 transition-colors active:text-red-700"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          )}

          {/* Active filter count + result count */}
          {filtered.length !== sales.length && (
            <p className="text-[11px] text-zinc-400">
              {filtered.length} von {sales.length} Verkäufen
            </p>
          )}
        </div>
      )}

      {/* ── Sales List (grouped by date) ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : sales.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
            <ShoppingBag size={28} className="text-zinc-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-700">
            Keine Verkäufe
          </h3>
          <p className="mt-1 text-[12px] text-zinc-400">
            Erfassen Sie Ihren ersten Verkauf
          </p>
        </div>
      ) : !showForm ? (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {group.label}
              </p>
              <div className="rounded-2xl border border-zinc-100 bg-white divide-y divide-zinc-100 overflow-hidden shadow-sm">
                {group.sales.map((sale) => (
                  <div key={sale.id} className="flex items-center transition-colors active:bg-zinc-50">
                    <Link
                      href={`/products/${sale.productId}`}
                      className="flex flex-1 items-center gap-3 px-4 py-3.5"
                    >
                      {/* Sequential number */}
                      <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500">
                        {saleIndexMap.get(sale.id)}
                      </span>

                      {/* Product image or icon */}
                      {sale.product.mainImage ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                          <Image src={sale.product.mainImage} alt={sale.product.name} fill className="object-cover" sizes="40px" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                          <ArrowUpRight size={18} className="text-emerald-600" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-zinc-900">
                          {sale.product.name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                          {sale.product.brand}
                          {sale.marketplace && (
                            <span className="ml-1 inline-flex items-center rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                              {sale.marketplace}
                            </span>
                          )}
                        </p>
                        {sale.customerName && (
                          <p className="mt-0.5 truncate text-[12px] font-medium text-zinc-700">
                            {sale.customerName}
                          </p>
                        )}
                      </div>

                      {/* Amount & time */}
                      <div className="text-right shrink-0">
                        <p className="text-[14px] font-bold text-zinc-900">
                          +{formatCurrency(sale.totalAmount)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-zinc-400">
                          {new Date(sale.soldAt).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </Link>

                    {/* Delete button */}
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(sale.id)}
                        disabled={deletingId === sale.id}
                        className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-400 disabled:opacity-40"
                        title="Verkauf l\u00f6schen"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
