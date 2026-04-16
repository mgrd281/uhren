"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Skeleton,
} from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Plus,
  X,
  ChevronRight,
  ShoppingBag,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Banknote,
  Gift,
  Store,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
const PAYMENT_METHODS = [
  { key: "Bar", label: "Bar", icon: Banknote },
  { key: "PayPal", label: "PayPal", icon: CreditCard },
  { key: "Geschenk", label: "Geschenk", icon: Gift },
];
const MARKETPLACES = [
  { key: "Shopify", label: "Shopify" },
  { key: "Kaufland", label: "Kaufland" },
  { key: "eBay Kleinanzeigen", label: "eBay KA" },
];
import { toast } from "sonner";
import Link from "next/link";

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
  product: { name: string; brand: string; quantity: number };
}

interface Product {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  salePriceExpected: number;
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

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMarketplace, setFilterMarketplace] = useState("");

  const [form, setForm] = useState({
    productId: "",
    quantitySold: "1",
    salePrice: "",
    customerName: "",
    invoiceNumber: "",
    notes: "",
    paymentMethod: "",
    marketplace: "",
  });

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

  function onProductSelect(productId: string) {
    const p = products.find((x) => x.id === productId);
    setForm((prev) => ({
      ...prev,
      productId,
      salePrice: p ? String(p.salePriceExpected) : "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      productId: form.productId,
      quantitySold: parseInt(form.quantitySold, 10),
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
      setForm({
        productId: "",
        quantitySold: "1",
        salePrice: "",
        customerName: "",
        invoiceNumber: "",
        notes: "",
        paymentMethod: "",
        marketplace: "",
      });

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
  const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const totalItems = sales.reduce((s, x) => s + x.quantitySold, 0);

  /* Filtered sales */
  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.product.name.toLowerCase().includes(q) ||
      s.product.brand.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q));
    const matchMarket =
      !filterMarketplace || s.marketplace === filterMarketplace;
    return matchSearch && matchMarket;
  });
  const grouped = groupByDate(filtered);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            Verkäufe
          </h1>
          <p className="mt-0.5 text-[12px] text-zinc-400">
            {sales.length} Transaktionen
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5",
            showForm
              ? "bg-zinc-200 text-zinc-700"
              : "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 active:scale-95"
          )}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          <span className="hidden text-[13px] font-medium sm:inline">
            {showForm ? "Abbrechen" : "Neuer Verkauf"}
          </span>
        </button>
      </div>

      {/* ── Revenue Summary Cards ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
        <div className="flex min-w-[150px] flex-col rounded-2xl bg-zinc-900 px-4 py-3 text-white">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Umsatz
          </span>
          <span className="mt-1 text-lg font-bold tracking-tight">
            {formatCurrency(totalRevenue)}
          </span>
          <span className="mt-0.5 text-[10px] text-zinc-500">
            {totalItems} Stück verkauft
          </span>
        </div>
        <div className="flex min-w-[130px] flex-col rounded-2xl bg-white border border-zinc-100 px-4 py-3 shadow-sm">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Ø pro Verkauf
          </span>
          <span className="mt-1 text-lg font-bold tracking-tight text-zinc-900">
            {sales.length > 0 ? formatCurrency(totalRevenue / sales.length) : "–"}
          </span>
        </div>
        <div className="flex min-w-[130px] flex-col rounded-2xl bg-white border border-zinc-100 px-4 py-3 shadow-sm">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Diesen Monat
          </span>
          <span className="mt-1 text-lg font-bold tracking-tight text-zinc-900">
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

      {/* ── New Sale Sheet ── */}
      {showForm && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl sm:p-6">
          <h3 className="mb-5 text-base font-bold text-zinc-900">
            Neuen Verkauf erfassen
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product picker */}
            <Select
              label="Produkt"
              value={form.productId}
              onChange={(e) => onProductSelect(e.target.value)}
              required
            >
              <option value="">Produkt auswählen…</option>
              {products
                .filter((p) => p.quantity > 0)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} – {p.name} ({p.quantity} verfügbar)
                  </option>
                ))}
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Menge"
                type="number"
                min="1"
                max={selectedProduct?.quantity ?? 999}
                value={form.quantitySold}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, quantitySold: e.target.value }))
                }
                required
              />
              <Input
                label="Preis (€)"
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, salePrice: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Kunde"
                placeholder="Optional"
                value={form.customerName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customerName: e.target.value }))
                }
              />
              <Input
                label="Rechnungsnr."
                placeholder="Optional"
                value={form.invoiceNumber}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    invoiceNumber: e.target.value,
                  }))
                }
              />
            </div>

            {/* Payment Method - pill style */}
            <div>
              <p className="mb-2 text-[12px] font-medium text-zinc-500">Zahlung</p>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, paymentMethod: m.key }))
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium transition-all",
                      form.paymentMethod === m.key
                        ? "bg-zinc-900 text-white shadow-md"
                        : "bg-zinc-100 text-zinc-600 active:bg-zinc-200"
                    )}
                  >
                    <m.icon size={14} />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Marketplace - pill style */}
            <div>
              <p className="mb-2 text-[12px] font-medium text-zinc-500">Plattform</p>
              <div className="flex gap-2">
                {MARKETPLACES.map((mp) => (
                  <button
                    key={mp.key}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, marketplace: mp.key }))
                    }
                    className={cn(
                      "rounded-full px-3.5 py-2 text-[12px] font-medium transition-all",
                      form.marketplace === mp.key
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-zinc-100 text-zinc-600 active:bg-zinc-200"
                    )}
                  >
                    {mp.label}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Notizen"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />

            {/* Total */}
            {selectedProduct && form.salePrice && (
              <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
                <span className="text-[12px] font-medium text-zinc-500">Gesamt</span>
                <span className="text-xl font-bold text-zinc-900">
                  {formatCurrency(
                    parseInt(form.quantitySold) * parseFloat(form.salePrice)
                  )}
                </span>
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-12 text-sm"
            >
              {saving ? "Wird erfasst…" : "Verkauf erfassen"}
            </Button>
          </form>
        </div>
      )}

      {/* ── Search & Filter ── */}
      {!showForm && sales.length > 0 && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-[13px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            />
          </div>
          <select
            value={filterMarketplace}
            onChange={(e) => setFilterMarketplace(e.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[12px] text-zinc-600 outline-none focus:border-zinc-400"
          >
            <option value="">Alle</option>
            {["Shopify", "Kaufland", "eBay Kleinanzeigen"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Sales List (grouped by date) ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : sales.length === 0 ? (
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
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {group.label}
              </p>
              <div className="rounded-2xl border border-zinc-100 bg-white divide-y divide-zinc-100 overflow-hidden shadow-sm">
                {group.sales.map((sale) => (
                  <Link
                    key={sale.id}
                    href={`/products/${sale.productId}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-zinc-50"
                  >
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                      <ArrowUpRight size={18} className="text-emerald-600" />
                    </div>

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
                        {sale.customerName && ` · ${sale.customerName}`}
                      </p>
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
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
