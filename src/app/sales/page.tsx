"use client";

import { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Select,
  Textarea,
  Skeleton,
  EmptyState,
} from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ShoppingBag, Plus, X } from "lucide-react";
const PAYMENT_METHODS = ["Bar", "PayPal", "Geschenk"];
const MARKETPLACES = ["Shopify", "Kaufland", "eBay Kleinanzeigen"];
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

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

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

      // Refresh
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Verkäufe"
        description={`${sales.length} registrierte Verkäufe`}
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Abbrechen" : "Neuen Verkauf erfassen"}
          </Button>
        }
      />

      {/* New sale form */}
      {showForm && (
        <Card className="border-zinc-200 shadow-md">
          <h3 className="mb-6 text-sm font-semibold text-zinc-700">
            Neuen Verkauf erfassen
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                label="Produkt"
                value={form.productId}
                onChange={(e) => onProductSelect(e.target.value)}
                required
              >
                <option value="">Produkt auswählen</option>
                {products
                  .filter((p) => p.quantity > 0)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand} - {p.name} (verfügbar: {p.quantity})
                    </option>
                  ))}
              </Select>
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
                label="Verkaufspreis (EUR)"
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, salePrice: e.target.value }))
                }
                required
              />
              <Input
                label="Kundenname (optional)"
                value={form.customerName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customerName: e.target.value }))
                }
              />
              <Input
                label="Rechnungsnr. (optional)"
                value={form.invoiceNumber}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    invoiceNumber: e.target.value,
                  }))
                }
              />
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <p className="mb-2 text-sm font-medium text-zinc-700">Zahlungsart</p>
                <div className="flex gap-3">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, paymentMethod: m }))}
                      className={`rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-all ${
                        form.paymentMethod === m
                          ? "border-zinc-800 bg-zinc-800 text-white"
                          : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <p className="mb-2 mt-3 text-sm font-medium text-zinc-700">Verkaufsplattform</p>
                <div className="flex gap-3">
                  {MARKETPLACES.map((mp) => (
                    <button
                      key={mp}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, marketplace: mp }))}
                      className={`rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-all ${
                        form.marketplace === mp
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                      }`}
                    >
                      {mp}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Textarea
              label="Notizen"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />

            {selectedProduct && form.salePrice && (
              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-[12px] text-zinc-400">Zusammenfassung</p>
                <p className="mt-1 text-lg font-bold text-zinc-900">
                  Gesamt:{" "}
                  {formatCurrency(
                    parseInt(form.quantitySold) * parseFloat(form.salePrice)
                  )}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Wird erfasst..." : "Verkauf erfassen"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Sales list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={48} />}
          title="Keine Verkäufe"
          description="Erfassen Sie Ihren ersten Verkauf"
        />
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <Card
              key={sale.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/products/${sale.productId}`}
                  className="text-[14px] font-semibold text-zinc-800 transition-colors hover:text-zinc-600"
                >
                  {sale.product.name}
                </Link>
                <p className="mt-0.5 text-[12px] text-zinc-400">
                  {sale.product.brand} · {sale.quantitySold} Stück ×{" "}
                  {formatCurrency(sale.salePrice)}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {formatDateTime(sale.soldAt)}
                  {sale.customerName && ` · ${sale.customerName}`}
                  {sale.invoiceNumber && ` · ${sale.invoiceNumber}`}
                  {sale.paymentMethod && ` · ${sale.paymentMethod}`}
                  {sale.marketplace && ` · ${sale.marketplace}`}
                </p>
              </div>
              <div className="text-end">
                <p className="text-lg font-bold text-zinc-900">
                  {formatCurrency(sale.totalAmount)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
