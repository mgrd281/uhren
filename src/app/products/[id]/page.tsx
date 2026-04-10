"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Skeleton,
} from "@/components/ui";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  stockStatusLabel,
  stockStatusColor,
  movementTypeLabel,
} from "@/lib/utils";
import { ArrowRight, Trash2, Edit, Watch, ShoppingBag, DollarSign, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { use } from "react";

interface Sale {
  id: string;
  quantitySold: number;
  salePrice: number;
  totalAmount: number;
  customerName: string | null;
  invoiceNumber: string | null;
  paymentMethod: string | null;
  shippingCost: number;
  soldAt: string;
  notes: string | null;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  note: string | null;
  createdAt: string;
}

interface GalleryImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  sku: string;
  category: string;
  color: string;
  description: string;
  costPrice: number;
  salePriceExpected: number;
  quantity: number;
  lowStockThreshold: number;
  status: string;
  mainImage: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  galleryImages: GalleryImage[];
  sales: Sale[];
  inventoryMoves: Movement[];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState({
    salePrice: "",
    quantitySold: "1",
    customerName: "",
    notes: "",
    soldAt: "",
    versand: false,
    shippingCost: "",
    paymentMethod: "",
  });
  const [saleSaving, setSaleSaving] = useState(false);
  const [editingField, setEditingField] = useState<"costPrice" | "salePriceExpected" | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => setProduct(d))
      .finally(() => setLoading(false));
  }, [id]);

  function reloadProduct() {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => setProduct(d));
  }

  async function savePrice() {
    if (!editingField || !product) return;
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) { toast.error("Ungültiger Preis"); return; }
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [editingField]: val }),
    });
    if (res.ok) {
      toast.success("Preis gespeichert");
      setEditingField(null);
      reloadProduct();
    } else {
      toast.error("Fehler beim Speichern");
    }
  }

  async function handleSale(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setSaleSaving(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          salePrice: parseFloat(saleForm.salePrice),
          quantitySold: parseInt(saleForm.quantitySold),
          customerName: saleForm.customerName || null,
          notes: saleForm.notes || null,
          paymentMethod: saleForm.paymentMethod || null,
          shippingCost: saleForm.shippingCost ? parseFloat(saleForm.shippingCost) : 0,
          soldAt: saleForm.soldAt ? new Date(saleForm.soldAt).toISOString() : new Date().toISOString(),
        }),
      });
      if (res.ok) {
        // If Versand checked, create shipping movement
        if (saleForm.versand) {
          await fetch("/api/inventory-movements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: product.id,
              type: "SHIPPING",
              quantity: parseInt(saleForm.quantitySold),
              note: "Versand" + (saleForm.customerName ? ` an ${saleForm.customerName}` : ""),
            }),
          });
        }
        // eBay-style cha-ching sound
        try { new Audio("/cha-ching.mp3").play(); } catch {}
        toast.success(saleForm.versand ? "Verkauf + Versand gespeichert" : "Verkauf erfolgreich gespeichert");
        setShowSaleModal(false);
        setSaleForm({ salePrice: "", quantitySold: "1", customerName: "", notes: "", soldAt: "", versand: false, shippingCost: "", paymentMethod: "" });
        reloadProduct();
      } else {
        const err = await res.json();
        toast.error(err.error || "Fehler beim Speichern");
      }
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setSaleSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Sind Sie sicher, dass Sie dieses Produkt löschen möchten?")) return;
    setDeleting(true);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Produkt gelöscht");
      router.push("/products");
    } else {
      toast.error("Löschen fehlgeschlagen");
      setDeleting(false);
    }
  }

  async function handleDeleteSale(saleId: string) {
    if (!confirm("Verkauf wirklich löschen? Der Bestand wird wiederhergestellt.")) return;
    const res = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Verkauf gelöscht, Bestand wiederhergestellt");
      reloadProduct();
    } else {
      toast.error("Löschen fehlgeschlagen");
    }
  }

  async function handleDeleteMovement(moveId: string) {
    if (!confirm("Bestandsbewegung wirklich löschen?")) return;
    const res = await fetch(`/api/inventory-movements/${moveId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Bestandsbewegung gelöscht");
      reloadProduct();
    } else {
      toast.error("Löschen fehlgeschlagen");
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center text-zinc-400">Produkt nicht gefunden</div>
    );
  }

  const inventoryValue = product.costPrice * product.quantity;
  const expectedValue = product.salePriceExpected * product.quantity;
  const totalSalesRevenue = product.sales.reduce(
    (sum, s) => sum + s.totalAmount,
    0
  );
  const totalSalesProfit = product.sales.reduce(
    (sum, s) => sum + (s.salePrice - product.costPrice) * s.quantitySold,
    0
  );

  return (
    <div className="space-y-10">
      <PageHeader
        title={product.name}
        description={`${product.brand} · ${product.model}`}
        actions={
          <div className="flex gap-2">
            {product.quantity > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  setSaleForm((f) => ({
                    ...f,
                    salePrice: product.salePriceExpected > 0 ? String(product.salePriceExpected) : "",
                  }));
                  setShowSaleModal(true);
                }}
              >
                <DollarSign size={14} />
                Verkauf erfassen
              </Button>
            )}
            <Link href={`/products/${id}/edit`}>
              <Button variant="secondary" size="sm">
                <Edit size={14} />
                Bearbeiten
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={14} />
              Löschen
            </Button>
          </div>
        }
      />

      {/* Hero section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image showcase */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-50">
            {product.mainImage ? (
              <Image
                src={product.mainImage}
                alt={product.name}
                fill
                className="object-contain p-6"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized={product.mainImage.startsWith("data:")}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Watch size={80} className="text-zinc-200" />
              </div>
            )}
          </div>
          {product.galleryImages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.galleryImages.map((img) => (
                <div
                  key={img.id}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-50"
                >
                  <Image
                    src={img.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Badge className={stockStatusColor(product.status)}>
              {stockStatusLabel(product.status)}
            </Badge>
            <span className="text-[12px] text-zinc-400">{product.sku}</span>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              {product.brand}
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
              {product.name}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
              {product.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-xl border border-zinc-100 bg-white p-4 cursor-pointer transition-colors hover:border-amber-200 hover:bg-amber-50/30"
              onClick={() => { setEditingField("costPrice"); setEditValue(String(product.costPrice)); }}
            >
              <p className="text-[11px] text-zinc-400">Einkaufspreis <span className="text-amber-500">✎</span></p>
              {editingField === "costPrice" ? (
                <form onSubmit={(e) => { e.preventDefault(); savePrice(); }} className="mt-1 flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-lg font-bold text-zinc-900 focus:border-amber-400 focus:outline-none"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === "Escape") setEditingField(null); }}
                  />
                  <button type="submit" onClick={(e) => e.stopPropagation()} className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700">OK</button>
                </form>
              ) : (
                <p className="text-lg font-bold text-zinc-900">
                  {formatCurrency(product.costPrice)}
                </p>
              )}
            </div>
            <div
              className="rounded-xl border border-zinc-100 bg-white p-4 cursor-pointer transition-colors hover:border-amber-200 hover:bg-amber-50/30"
              onClick={() => { setEditingField("salePriceExpected"); setEditValue(String(product.salePriceExpected)); }}
            >
              <p className="text-[11px] text-zinc-400">Erwarteter VK-Preis <span className="text-amber-500">✎</span></p>
              {editingField === "salePriceExpected" ? (
                <form onSubmit={(e) => { e.preventDefault(); savePrice(); }} className="mt-1 flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-lg font-bold text-zinc-900 focus:border-amber-400 focus:outline-none"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === "Escape") setEditingField(null); }}
                  />
                  <button type="submit" onClick={(e) => e.stopPropagation()} className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700">OK</button>
                </form>
              ) : (
                <p className="text-lg font-bold text-zinc-900">
                  {formatCurrency(product.salePriceExpected)}
                </p>
              )}
            </div>
            <Card className="!p-4">
              <p className="text-[11px] text-zinc-400">Aktueller Bestand</p>
              <p className="text-lg font-bold text-zinc-900">
                {formatNumber(product.quantity)} Stück
              </p>
            </Card>
            <Card className="!p-4">
              <p className="text-[11px] text-zinc-400">Bestandswert</p>
              <p className="text-lg font-bold text-zinc-900">
                {formatCurrency(inventoryValue)}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-zinc-50 p-4 text-center">
              <p className="text-[11px] text-zinc-400">Gesamtumsatz</p>
              <p className="mt-1 text-sm font-bold text-zinc-900">
                {formatCurrency(totalSalesRevenue)}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <p className="text-[11px] text-emerald-600">Realisierter Gewinn</p>
              <p className="mt-1 text-sm font-bold text-emerald-700">
                {formatCurrency(totalSalesProfit)}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <p className="text-[11px] text-blue-600">Erwarteter Wert</p>
              <p className="mt-1 text-sm font-bold text-blue-700">
                {formatCurrency(expectedValue)}
              </p>
            </div>
          </div>

          {product.notes && (
            <div className="rounded-xl border border-zinc-100 p-4">
              <p className="text-[11px] font-medium text-zinc-400">Notizen</p>
              <p className="mt-1 text-[13px] text-zinc-600">{product.notes}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-[12px] text-zinc-400">
            <span>Kategorie: {product.category}</span>
            <span>·</span>
            <span>Farbe: {product.color}</span>
            <span>·</span>
            <span>Warngrenze: {product.lowStockThreshold}</span>
          </div>
        </div>
      </div>

      {/* Sales timeline */}
      <Card>
        <div className="mb-6 flex items-center gap-2">
          <ShoppingBag size={18} className="text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-700">
            Verkaufshistorie ({product.sales.length})
          </h3>
        </div>

        {product.sales.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-zinc-400">
            Noch keine Verkäufe für dieses Produkt
          </p>
        ) : (
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute start-4 top-0 bottom-0 w-px bg-zinc-100" />

            {product.sales.map((sale, idx) => (
              <div key={sale.id} className="relative flex gap-5 pb-6">
                {/* Dot */}
                <div className="relative z-10 mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                </div>

                {/* Content */}
                <div className="flex-1 rounded-xl border border-zinc-100 p-4 transition-colors hover:bg-zinc-50">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-medium text-zinc-800">
                        {sale.quantitySold} Stück × {formatCurrency(sale.salePrice)}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {formatDateTime(sale.soldAt)}
                        {sale.customerName && ` · ${sale.customerName}`}
                        {sale.paymentMethod && ` · ${sale.paymentMethod}`}
                        {sale.shippingCost > 0 && ` · Versand ${formatCurrency(sale.shippingCost)}`}
                        {sale.invoiceNumber && ` · ${sale.invoiceNumber}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-bold text-zinc-900">
                        {formatCurrency(sale.totalAmount)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteSale(sale.id);
                        }}
                        className="rounded-lg p-1.5 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Verkauf löschen"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  {sale.notes && (
                    <p className="mt-2 text-[11px] text-zinc-400">
                      {sale.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Inventory movements */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-zinc-700">
          Bestandsbewegungen
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] text-zinc-400">
                <th className="py-3 font-medium text-start">Typ</th>
                <th className="py-3 font-medium text-start">Menge</th>
                <th className="py-3 font-medium text-start">Notiz</th>
                <th className="py-3 font-medium text-start">Datum</th>
                <th className="py-3 font-medium text-end w-10"></th>
              </tr>
            </thead>
            <tbody>
              {product.inventoryMoves.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-zinc-50 transition-colors hover:bg-zinc-50"
                >
                  <td className="py-3">
                    <Badge
                      className={
                        m.type === "SALE"
                          ? "bg-red-50 text-red-600"
                          : m.type === "ADD"
                          ? "bg-emerald-50 text-emerald-600"
                          : m.type === "SHIPPING"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-amber-50 text-amber-600"
                      }
                    >
                      {movementTypeLabel(m.type)}
                    </Badge>
                  </td>
                  <td className="py-3 font-medium">{m.quantity}</td>
                  <td className="py-3 text-zinc-500">{m.note ?? "—"}</td>
                  <td className="py-3 text-zinc-400">
                    {formatDateTime(m.createdAt)}
                  </td>
                  <td className="py-3 text-end">
                    <button
                      onClick={() => handleDeleteMovement(m.id)}
                      className="rounded-lg p-1.5 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Bewegung löschen"
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-900">Verkauf erfassen</h3>
            <p className="mt-1 text-[13px] text-zinc-400">
              {product.name} — Bestand: {product.quantity} Stück
            </p>
            <form onSubmit={handleSale} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-zinc-600">
                  Verkaufspreis (€) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="z.B. 149.00"
                  value={saleForm.salePrice}
                  onChange={(e) => setSaleForm((f) => ({ ...f, salePrice: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-zinc-600">
                  Menge *
                </label>
                <Input
                  type="number"
                  min="1"
                  max={product.quantity}
                  required
                  value={saleForm.quantitySold}
                  onChange={(e) => setSaleForm((f) => ({ ...f, quantitySold: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-zinc-600">
                  Verkaufsdatum (leer = heute)
                </label>
                <Input
                  type="date"
                  value={saleForm.soldAt}
                  onChange={(e) => setSaleForm((f) => ({ ...f, soldAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-zinc-600">
                  Kunde (optional)
                </label>
                <Input
                  placeholder="Kundenname"
                  value={saleForm.customerName}
                  onChange={(e) => setSaleForm((f) => ({ ...f, customerName: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-zinc-600">
                  Notiz (optional)
                </label>
                <Input
                  placeholder="z.B. Bar bezahlt"
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-zinc-600">
                  Zahlungsart
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Bar", "PayPal", "eBay Kleinanzeigen", "Vorkasse"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSaleForm((f) => ({ ...f, paymentMethod: f.paymentMethod === method ? "" : method }))}
                      className={`rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${
                        saleForm.paymentMethod === method
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3 cursor-pointer transition-colors hover:bg-blue-50">
                <input
                  type="checkbox"
                  checked={saleForm.versand}
                  onChange={(e) => setSaleForm((f) => ({ ...f, versand: e.target.checked }))}
                  className="h-5 w-5 rounded border-zinc-300 text-blue-600 accent-blue-600"
                />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-zinc-700">📦 Versand</p>
                  <p className="text-[11px] text-zinc-400">Ware wird auch als versendet markiert</p>
                </div>
              </label>
              {saleForm.versand && (
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-zinc-600">
                    Versandkosten (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="z.B. 5.99"
                    value={saleForm.shippingCost}
                    onChange={(e) => setSaleForm((f) => ({ ...f, shippingCost: e.target.value }))}
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saleSaving} className="flex-1">
                  {saleSaving ? "Speichern..." : "Verkauf speichern"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowSaleModal(false)}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
