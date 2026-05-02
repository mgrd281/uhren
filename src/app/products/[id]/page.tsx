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
  cn,
} from "@/lib/utils";
import { ArrowRight, Trash2, Edit, Watch, ShoppingBag, DollarSign, X, ImagePlus, Star, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { use } from "react";
import { useRole } from "@/lib/useRole";

interface Sale {
  id: string;
  quantitySold: number;
  salePrice: number;
  totalAmount: number;
  customerName: string | null;
  invoiceNumber: string | null;
  paymentMethod: string | null;
  marketplace: string | null;
  shippingCost: number;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  packagingCost: number;
  shippingAddress: string | null;
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
  ebayStatus: string;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  storageLocation: string | null;
  storagePhoto: string | null;
  kartonAnzahl: number;
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
  const { canEdit, canDelete } = useRole();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState({
    salePrice: "",
    quantitySold: "1",
    customerName: "",
    invoiceNumber: "",
    notes: "",
    soldAt: "",
    versand: false,
    shippingCost: "",
    shippingCarrier: "",
    trackingNumber: "",
    packagingCost: "",
    shippingAddress: "",
    paymentMethod: "",
    marketplace: "",
    customPayment: "",
    customMarketplace: "",
  });
  const [saleSaving, setSaleSaving] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    salePrice: "", quantitySold: "1", customerName: "", invoiceNumber: "",
    paymentMethod: "", marketplace: "", notes: "", soldAt: "",
    shippingCost: "", shippingCarrier: "", trackingNumber: "", packagingCost: "", shippingAddress: "",
  });
  const [editingField, setEditingField] = useState<"costPrice" | "salePriceExpected" | "quantity" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageForm, setStorageForm] = useState({ location: "", photo: "" });
  const [storageSaving, setStorageSaving] = useState(false);

  useEffect(() => {
    setLoadError(null);
    setLoading(true);

    fetch(`/api/products/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error || "Fehler beim Laden des Produkts");
        }
        setProduct(data);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Fehler beim Laden des Produkts";
        setLoadError(message);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function reloadProduct() {
    fetch(`/api/products/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error || "Fehler beim Laden des Produkts");
        }
        setProduct(data);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Fehler beim Laden des Produkts";
        setLoadError(message);
        setProduct(null);
      });
  }

  async function savePrice() {
    if (!editingField || !product) return;
    const val = editingField === "quantity" ? parseInt(editValue, 10) : parseFloat(editValue);
    if (isNaN(val) || val < 0) {
      toast.error(editingField === "quantity" ? "Ungültige Menge" : "Ungültiger Preis");
      return;
    }
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [editingField]: val }),
    });
    if (res.ok) {
      toast.success(editingField === "quantity" ? "Bestand gespeichert" : "Preis gespeichert");
      setEditingField(null);
      reloadProduct();
    } else {
      toast.error("Fehler beim Speichern");
    }
  }

  async function handleSaveStorage() {
    if (!product) return;
    setStorageSaving(true);
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storageLocation: storageForm.location || null,
        storagePhoto: storageForm.photo || null,
      }),
    });
    if (res.ok) {
      toast.success("Lagerort gespeichert");
      setShowStorageModal(false);
      reloadProduct();
    } else {
      toast.error("Fehler beim Speichern");
    }
    setStorageSaving(false);
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
          invoiceNumber: saleForm.invoiceNumber || null,
          notes: saleForm.notes || null,
          paymentMethod: (saleForm.paymentMethod === "__custom" ? saleForm.customPayment : saleForm.paymentMethod) || null,
          marketplace: (saleForm.marketplace === "__custom" ? saleForm.customMarketplace : saleForm.marketplace) || null,
          shippingCost: saleForm.shippingCost ? parseFloat(saleForm.shippingCost) : 0,
          shippingCarrier: saleForm.shippingCarrier || null,
          trackingNumber: saleForm.trackingNumber || null,
          packagingCost: saleForm.packagingCost ? parseFloat(saleForm.packagingCost) : 0,
          shippingAddress: saleForm.shippingAddress || null,
          soldAt: saleForm.soldAt ? new Date(saleForm.soldAt + "T12:00:00").toISOString() : new Date().toISOString(),
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
        setSaleForm({ salePrice: "", quantitySold: "1", customerName: "", invoiceNumber: "", notes: "", soldAt: "", versand: false, shippingCost: "", shippingCarrier: "", trackingNumber: "", packagingCost: "", shippingAddress: "", paymentMethod: "", marketplace: "", customPayment: "", customMarketplace: "" });
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

  async function handleEditSale(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSale) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/sales/${editingSale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salePrice: editForm.salePrice,
          quantitySold: editForm.quantitySold,
          customerName: editForm.customerName || null,
          invoiceNumber: editForm.invoiceNumber || null,
          paymentMethod: editForm.paymentMethod || null,
          marketplace: editForm.marketplace || null,
          notes: editForm.notes || null,
          shippingCost: editForm.shippingCost || 0,
          shippingCarrier: editForm.shippingCarrier || null,
          trackingNumber: editForm.trackingNumber || null,
          packagingCost: editForm.packagingCost || 0,
          shippingAddress: editForm.shippingAddress || null,
          soldAt: editForm.soldAt || null,
        }),
      });
      if (res.ok) {
        toast.success("Verkauf aktualisiert");
        setEditingSale(null);
        reloadProduct();
      } else {
        toast.error("Aktualisierung fehlgeschlagen");
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setEditSaving(false);
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

  async function handleDeleteGalleryImage(imageId: string) {
    if (!confirm("Bild wirklich löschen?")) return;
    setDeletingImageId(imageId);
    try {
      const res = await fetch(`/api/gallery-images/${imageId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Bild gelöscht");
        reloadProduct();
      } else {
        toast.error("Löschen fehlgeschlagen");
      }
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setDeletingImageId(null);
    }
  }

  async function handleSetPrimaryImage(imageId: string, imageUrl: string) {
    try {
      const res = await fetch(`/api/gallery-images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      if (res.ok) {
        toast.success("Als Hauptbild gesetzt");
        reloadProduct();
      } else {
        toast.error("Fehler beim Setzen des Hauptbilds");
      }
    } catch {
      toast.error("Netzwerkfehler");
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

  if (loadError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <h2 className="mb-2 text-2xl font-semibold">Fehler beim Laden des Produkts</h2>
        <p className="text-sm text-red-600">{loadError}</p>
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
  const isPostedOnEbay =
    product.ebayStatus === "eBay Kleinanzeigen" ||
    product.ebayStatus === "eBay Kleinanzeige";

  return (
    <div className="space-y-10">
      <PageHeader
        title={product.name}
        description={`${product.brand} · ${product.model}`}
        actions={
          <div className="flex gap-2">
            {canEdit && product.quantity > 0 && (
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
            {canEdit && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setStorageForm({
                    location: product.storageLocation || "",
                    photo: product.storagePhoto || "",
                  });
                  setShowStorageModal(true);
                }}
              >
                <span className="text-[13px]">📦</span>
                Lagerort
              </Button>
            )}
            {canEdit && (
            <Link href={`/products/${id}/edit`}>
              <Button variant="secondary" size="sm">
                <Edit size={14} />
                Bearbeiten
              </Button>
            </Link>
            )}
            {canDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={14} />
              Löschen
            </Button>
            )}
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
                unoptimized={product.mainImage.startsWith("data:") || product.mainImage.startsWith("http")}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Watch size={80} className="text-zinc-200" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {product.galleryImages.length > 0 && (
              <span className="text-[12px] text-zinc-400">
                {product.galleryImages.length} Galerie-Bilder
              </span>
            )}
          </div>
          {product.galleryImages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.galleryImages.map((img) => (
                <div
                  key={img.id}
                  className={`group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-50 border-2 ${img.isPrimary ? "border-black bg-black/5" : "border-zinc-200"}`}
                >
                  <Image
                    src={img.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized={img.imageUrl.startsWith("http")}
                  />
                  {canEdit && (
                  <div className="absolute inset-0 flex items-end justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                    {!img.isPrimary && (
                      <button
                        onClick={(e) => { e.preventDefault(); handleSetPrimaryImage(img.id, img.imageUrl); }}
                        className="rounded bg-white/90 p-1 text-zinc-900 hover:bg-zinc-100"
                        title="Als Hauptbild setzen"
                      >
                        <Star size={12} className="fill-black text-black" />
                      </button>
                    )}
                    {canDelete && (
                    <button
                      onClick={(e) => { e.preventDefault(); handleDeleteGalleryImage(img.id); }}
                      className="rounded bg-white/90 p-1 text-red-500 hover:bg-red-100"
                      title="Bild löschen"
                      disabled={deletingImageId === img.id}
                    >
                      <X size={12} />
                    </button>
                    )}
                  </div>
                  )}
                  {img.isPrimary && (
                    <div className="absolute start-1 top-1">
                      <Star size={12} className="fill-black text-black" />
                    </div>
                  )}
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
            {canEdit ? (
              <button
                onClick={async () => {
                  const newStatus = isPostedOnEbay ? "Nicht gepostet" : "eBay Kleinanzeigen";
                  const res = await fetch(`/api/products/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ebayStatus: newStatus }),
                  });
                  if (res.ok) { toast.success(newStatus === "eBay Kleinanzeigen" ? "✅ Als eBay Kleinanzeige markiert" : "Nicht gepostet"); reloadProduct(); }
                  else toast.error("Fehler");
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-all hover:scale-105 active:scale-95 ${
                  isPostedOnEbay
                    ? "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    : "border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-700"
                }`}
              >
                <span className="text-[11px]">{isPostedOnEbay ? "✅" : "⬜"}</span>
                {isPostedOnEbay ? "eBay Kleinanzeige" : "Nicht gepostet"}
              </button>
            ) : (
              <Badge className={isPostedOnEbay ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}>
                {isPostedOnEbay ? "eBay Kleinanzeige" : "Nicht gepostet"}
              </Badge>
            )}
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
              className={cn("rounded-xl border border-zinc-100 bg-white p-4 transition-colors", canEdit && "cursor-pointer hover:border-amber-200 hover:bg-amber-50/30")}
              onClick={() => { if (canEdit) { setEditingField("costPrice"); setEditValue(String(product.costPrice)); } }}
            >
              <p className="text-[11px] text-zinc-400">Einkaufspreis {canEdit && <span className="text-amber-500">✎</span>}</p>
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
              className={cn("rounded-xl border border-zinc-100 bg-white p-4 transition-colors", canEdit && "cursor-pointer hover:border-amber-200 hover:bg-amber-50/30")}
              onClick={() => { if (canEdit) { setEditingField("salePriceExpected"); setEditValue(String(product.salePriceExpected)); } }}
            >
              <p className="text-[11px] text-zinc-400">Verkauf Preis {canEdit && <span className="text-amber-500">✎</span>}</p>
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
            <div
              className={cn("rounded-xl border border-zinc-100 bg-white p-4 transition-colors", canEdit && "cursor-pointer hover:border-amber-200 hover:bg-amber-50/30")}
              onClick={() => { if (canEdit) { setEditingField("quantity"); setEditValue(String(product.quantity)); } }}
            >
              <p className="text-[11px] text-zinc-400">Aktueller Bestand {canEdit && <span className="text-amber-500">✎</span>}</p>
              {editingField === "quantity" ? (
                <form onSubmit={(e) => { e.preventDefault(); savePrice(); }} className="mt-1 flex gap-2">
                  <input
                    type="number"
                    step="1"
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
                  {formatNumber(product.quantity)} Stück
                </p>
              )}
            </div>
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
            <span>·</span>
            <span>eBay: {isPostedOnEbay ? "Kleinanzeige" : "Nicht gepostet"}</span>
            {["Michael Kors", "BOSS", "Emporio Armani", "Armani Exchange", "Diesel"].includes(product.brand) && product.kartonAnzahl > 0 && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                  📦 {product.kartonAnzahl} Karton{product.kartonAnzahl !== 1 ? "s" : ""}
                </span>
              </>
            )}
            {product.storageLocation && (
              <>
                <span>·</span>
                <button
                  onClick={() => { setStorageForm({ location: product.storageLocation || "", photo: product.storagePhoto || "" }); setShowStorageModal(true); }}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  📦 {product.storageLocation}
                </button>
              </>
            )}
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
                  <span className="text-[10px] font-bold">{product.sales.length - idx}</span>
                </div>

                {/* Content */}
                <div className="flex-1 rounded-xl border border-zinc-100 p-4 transition-colors hover:bg-zinc-50">
                  {/* Date badge */}
                  <div className="mb-2.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                      {new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/Berlin" }).format(new Date(sale.soldAt))}
                    </span>
                    {sale.marketplace && (
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        sale.marketplace === "Shopify" ? "bg-emerald-50 text-emerald-700" :
                        sale.marketplace === "Kaufland" ? "bg-red-50 text-red-600" :
                        sale.marketplace.includes("eBay") ? "bg-yellow-50 text-yellow-700" :
                        "bg-blue-50 text-blue-600"
                      }`}>
                        {sale.marketplace}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-zinc-800">
                        {sale.quantitySold} Stück × {formatCurrency(sale.salePrice)}
                      </p>
                      {sale.customerName && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-0.5">
                            <span className="text-[10px] text-zinc-400">👤</span>
                            <span className="text-[12px] font-semibold tracking-tight text-white">{sale.customerName}</span>
                          </span>
                        </div>
                      )}
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        {sale.paymentMethod && `${sale.paymentMethod}`}
                        {sale.paymentMethod && sale.shippingCost > 0 && ` · `}
                        {sale.shippingCost > 0 && `Versand ${formatCurrency(sale.shippingCost)}`}
                        {(sale.paymentMethod || sale.shippingCost > 0) && sale.invoiceNumber && ` · `}
                        {sale.invoiceNumber && `${sale.invoiceNumber}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        {((sale.shippingCost ?? 0) > 0 || (sale.packagingCost ?? 0) > 0) && (
                          <p className="text-[13px] font-semibold text-zinc-800">
                            {formatCurrency(sale.salePrice * sale.quantitySold)}
                          </p>
                        )}
                        <p className="text-[15px] font-bold text-red-600">
                          {formatCurrency(sale.totalAmount)}
                        </p>
                        {((sale.shippingCost ?? 0) > 0 || (sale.packagingCost ?? 0) > 0) && (
                          <p className="text-[10px] text-zinc-400">
                            − {formatCurrency((sale.shippingCost ?? 0) + (sale.packagingCost ?? 0))} Versand
                          </p>
                        )}
                      </div>
                      {canEdit && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingSale(sale);
                          setEditForm({
                            salePrice: String(sale.salePrice),
                            quantitySold: String(sale.quantitySold),
                            customerName: sale.customerName || "",
                            invoiceNumber: sale.invoiceNumber || "",
                            paymentMethod: sale.paymentMethod || "",
                            marketplace: sale.marketplace || "",
                            notes: sale.notes || "",
                            soldAt: sale.soldAt ? new Date(sale.soldAt).toISOString().slice(0, 10) : "",
                            shippingCost: sale.shippingCost ? String(sale.shippingCost) : "",
                            shippingCarrier: sale.shippingCarrier || "",
                            trackingNumber: sale.trackingNumber || "",
                            packagingCost: sale.packagingCost ? String(sale.packagingCost) : "",
                            shippingAddress: sale.shippingAddress || "",
                          });
                        }}
                        className="rounded-lg p-1.5 text-zinc-300 transition-colors hover:bg-amber-50 hover:text-amber-500"
                        title="Verkauf bearbeiten"
                      >
                        <Edit size={14} />
                      </button>
                      )}
                      {canDelete && (
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
                      )}
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
                    {canDelete && (
                    <button
                      onClick={() => handleDeleteMovement(m.id)}
                      className="rounded-lg p-1.5 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Bewegung löschen"
                    >
                      <X size={14} />
                    </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sale Modal */}
      {showSaleModal && product && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSaleModal(false); }}
        >
          <div className="mx-4 w-full max-w-2xl rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 bg-zinc-950 px-6 py-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
                {product.mainImage ? (
                  <Image
                    src={product.mainImage}
                    alt={product.name}
                    fill
                    className="object-contain p-1"
                    sizes="48px"
                    unoptimized={product.mainImage.startsWith("data:") || product.mainImage.startsWith("http")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Watch size={22} className="text-white/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-white leading-tight">Verkauf erfassen</h3>
                <p className="text-[11px] text-zinc-400 truncate">{product.brand} · {product.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">Bestand: {product.quantity} Stück</span>
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">EK: {formatCurrency(product.costPrice)}</span>
                </div>
              </div>
              <button
                onClick={() => setShowSaleModal(false)}
                className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable form */}
            <form id="sale-form" onSubmit={handleSale} className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">

              {/* ── Preis & Menge ── */}
              <div className="grid grid-cols-2 gap-3">
                {saleForm.paymentMethod !== "Geschenk" ? (
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Preis (€) *</label>
                    <Input type="number" step="0.01" min="0.01" required placeholder="0.00" value={saleForm.salePrice} onChange={(e) => setSaleForm((f) => ({ ...f, salePrice: e.target.value }))} className="text-[18px] font-bold h-12" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-center h-12 mt-[22px]">
                    <p className="text-[13px] font-semibold text-emerald-700">🎁 Geschenk — 0 €</p>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Menge *</label>
                  <Input type="number" min="1" max={product.quantity} required value={saleForm.quantitySold} onChange={(e) => setSaleForm((f) => ({ ...f, quantitySold: e.target.value }))} className="text-[18px] font-bold h-12" />
                </div>
              </div>

              {/* ── Live-Vorschau ── */}
              {saleForm.salePrice && saleForm.quantitySold && saleForm.paymentMethod !== "Geschenk" && (() => {
                const qty = parseInt(saleForm.quantitySold || "1");
                const price = parseFloat(saleForm.salePrice || "0");
                const shipping = saleForm.versand ? parseFloat(saleForm.shippingCost || "0") : 0;
                const packaging = parseFloat(saleForm.packagingCost || "0");
                const total = price * qty;
                const costs = shipping + packaging;
                const net = total - costs;
                const profit = net - product.costPrice * qty;
                return (
                  <div className="rounded-2xl bg-zinc-950 px-4 py-3 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">Einnahmen (netto)</p>
                        <p className="text-[22px] font-black tracking-tight leading-none mt-0.5">{formatCurrency(net)}</p>
                        {costs > 0 && <p className="text-[10px] text-zinc-500 mt-0.5">{formatCurrency(total)} − {formatCurrency(costs)} Versand</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">Gewinn</p>
                        <p className={`text-[20px] font-black tracking-tight leading-none mt-0.5 ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">EK: {formatCurrency(product.costPrice)}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Zahlungsart + Kanal ── */}
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Zahlungsart</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "Bar" }, { key: "PayPal" }, { key: "Überweisung", label: "Überw." }, { key: "eBay Kleinanzeigen", label: "eBay KA" }, { key: "Geschenk", label: "Geschenk 🎁" },
                  ].map(({ key, label }) => (
                    <button key={key} type="button"
                      onClick={() => setSaleForm((f) => ({ ...f, paymentMethod: f.paymentMethod === key ? "" : key, salePrice: key === "Geschenk" ? "0" : f.salePrice }))}
                      className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${saleForm.paymentMethod === key ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
                      {label || key}
                    </button>
                  ))}
                  {saleForm.paymentMethod === "__custom" ? (
                    <div className="flex gap-1.5 flex-1 min-w-[160px]">
                      <Input autoFocus placeholder="Zahlungsart…" className="flex-1 h-8 text-[12px]" value={saleForm.customPayment || ""} onChange={(e) => setSaleForm((f) => ({ ...f, customPayment: e.target.value }))} />
                      <button type="button" onClick={() => setSaleForm((f) => ({ ...f, paymentMethod: "", customPayment: "" }))} className="rounded-lg px-2 text-zinc-400 ring-1 ring-zinc-200 hover:bg-zinc-50"><X size={12} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setSaleForm((f) => ({ ...f, paymentMethod: "__custom", customPayment: "" }))} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-zinc-300 ring-1 ring-dashed ring-zinc-200 hover:text-zinc-400">+ Andere</button>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Kanal <span className="font-normal normal-case text-zinc-300">optional</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "Shopify" }, { key: "eBay Kleinanzeigen", label: "eBay KA" }, { key: "Kaufland" },
                  ].map(({ key, label }) => (
                    <button key={key} type="button"
                      onClick={() => setSaleForm((f) => ({ ...f, marketplace: f.marketplace === key ? "" : key }))}
                      className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${saleForm.marketplace === key ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
                      {label || key}
                    </button>
                  ))}
                  {saleForm.marketplace === "__custom" ? (
                    <div className="flex gap-1.5 flex-1 min-w-[140px]">
                      <Input autoFocus placeholder="Kanal…" className="flex-1 h-8 text-[12px]" value={saleForm.customMarketplace || ""} onChange={(e) => setSaleForm((f) => ({ ...f, customMarketplace: e.target.value }))} />
                      <button type="button" onClick={() => setSaleForm((f) => ({ ...f, marketplace: "", customMarketplace: "" }))} className="rounded-lg px-2 text-zinc-400 ring-1 ring-zinc-200 hover:bg-zinc-50"><X size={12} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setSaleForm((f) => ({ ...f, marketplace: "__custom", customMarketplace: "" }))} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-zinc-300 ring-1 ring-dashed ring-zinc-200 hover:text-zinc-400">+ Andere</button>
                  )}
                </div>
              </div>

              </div>

              <div className="h-px bg-zinc-100" />

              {/* ── Datum · Rechnung · Notiz ── */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Datum</label>
                    <button
                      type="button"
                      onClick={() => setSaleForm((f) => ({ ...f, soldAt: "" }))}
                      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition-all ${!saleForm.soldAt ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-100"}`}
                    >
                      ? Unbekannt
                    </button>
                  </div>
                  {saleForm.soldAt ? (
                    <Input type="date" value={saleForm.soldAt} onChange={(e) => setSaleForm((f) => ({ ...f, soldAt: e.target.value }))} className="text-[12px]" />
                  ) : (
                    <div className="flex h-9 items-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3">
                      <span className="text-[11px] text-zinc-400">Datum unbekannt</span>
                      <button type="button" onClick={() => setSaleForm((f) => ({ ...f, soldAt: new Date().toISOString().slice(0,10) }))} className="ml-auto text-[10px] text-zinc-400 hover:text-zinc-600">heute</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Rechnung</label>
                  <Input placeholder="Nr." value={saleForm.invoiceNumber || ""} onChange={(e) => setSaleForm((f) => ({ ...f, invoiceNumber: e.target.value }))} className="text-[12px]" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Notiz <span className="font-normal normal-case text-zinc-300">optional</span></label>
                  <Input placeholder="z.B. Abholung…" value={saleForm.notes} onChange={(e) => setSaleForm((f) => ({ ...f, notes: e.target.value }))} className="text-[12px]" />
                </div>
              </div>

              {/* ── Lieferadresse ── */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  <span>📍</span> Lieferadresse <span className="font-normal normal-case text-zinc-300">optional</span>
                </label>
                <textarea
                  rows={2}
                  placeholder={"Name · Straße · PLZ Ort"}
                  value={saleForm.shippingAddress}
                  onChange={(e) => setSaleForm((f) => ({ ...f, shippingAddress: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[13px] outline-none placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 resize-none bg-white"
                />
              </div>

              {/* ── Versand Toggle ── */}
              <div className={`rounded-xl border transition-all ${saleForm.versand ? "border-blue-200 bg-blue-50/60" : "border-zinc-100"}`}>
                <label className="flex cursor-pointer items-center gap-3 px-3.5 py-3">
                  <input type="checkbox" checked={saleForm.versand} onChange={(e) => setSaleForm((f) => ({ ...f, versand: e.target.checked }))} className="h-4 w-4 rounded accent-blue-600 shrink-0" />
                  <span className="text-[13px] font-semibold text-zinc-700">📦 Versand</span>
                  <span className="ml-auto text-[11px] text-zinc-400">als versendet markieren</span>
                </label>

                {saleForm.versand && (
                  <div className="space-y-3 border-t border-blue-100 px-3.5 pb-3.5 pt-3">

                  {/* Kosten */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Versandkosten (€)</label>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" value={saleForm.shippingCost} onChange={(e) => setSaleForm((f) => ({ ...f, shippingCost: e.target.value }))} className="text-[13px]" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Verpackung (€)</label>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" value={saleForm.packagingCost} onChange={(e) => setSaleForm((f) => ({ ...f, packagingCost: e.target.value }))} className="text-[13px]" />
                      </div>
                    </div>

                    {/* Dienstleister */}
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Dienstleister</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { key: "DHL", price: "6.19" },
                          { key: "DHL Express", price: null },
                          { key: "Hermes", price: "5.79" },
                          { key: "GLS", price: null },
                          { key: "DPD", price: null },
                          { key: "Andere", price: null },
                        ].map(({ key, price }) => (
                          <button key={key} type="button" onClick={() => setSaleForm((f) => {
                            const toggling = f.shippingCarrier === key;
                            return {
                              ...f,
                              shippingCarrier: toggling ? "" : key,
                              shippingCost: !toggling && price ? price : f.shippingCost,
                            };
                          })}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${saleForm.shippingCarrier === key ? "bg-blue-600 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:ring-zinc-300"}`}>
                            {key}{price && <span className={`ml-1 text-[10px] ${saleForm.shippingCarrier === key ? "text-blue-200" : "text-zinc-400"}`}>{price} €</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sendungsnummer */}
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Sendungsnummer</label>
                      <Input placeholder="optional" value={saleForm.trackingNumber} onChange={(e) => setSaleForm((f) => ({ ...f, trackingNumber: e.target.value }))} className="text-[12px]" />
                    </div>

                  </div>
                )}
              </div>

              {/* ── Verpackungskosten (ohne Versand) ── */}
              {!saleForm.versand && (
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Verpackung (€) <span className="font-normal normal-case text-zinc-300">optional</span></label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={saleForm.packagingCost} onChange={(e) => setSaleForm((f) => ({ ...f, packagingCost: e.target.value }))} className="text-[13px]" />
                </div>
              )}

            </form>

            {/* Footer */}
            <div className="border-t border-zinc-100 p-4 flex gap-3">
              <Button type="submit" form="sale-form" disabled={saleSaving} className="flex-1 h-11 text-[14px] font-semibold">
                {saleSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Speichern...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <DollarSign size={16} />
                    Verkauf speichern
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowSaleModal(false)}
                className="h-11 px-6"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Christ Image Import Modal */}

      {/* Lagerort Modal */}
      {showStorageModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowStorageModal(false); }}
        >
          <div className="w-full max-w-md rounded-t-3xl bg-white sm:rounded-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 bg-zinc-950 px-5 py-4 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white text-lg">📦</div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-white">Lagerort</h3>
                <p className="text-[11px] text-zinc-400">{product.brand} · {product.name}</p>
              </div>
              <button onClick={() => setShowStorageModal(false)} className="rounded-xl p-2 text-zinc-500 hover:bg-white/10 hover:text-white">
                <X size={17} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4">
              {/* Lagerort Text */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Lagerort / Position</label>
                <Input
                  placeholder="z.B. Vitrine A · Fach 3 · Reihe 2"
                  value={storageForm.location}
                  onChange={(e) => setStorageForm((f) => ({ ...f, location: e.target.value }))}
                  className="text-[14px] font-medium"
                />
                <p className="mt-1.5 text-[10px] text-zinc-400">Beispiele: Vitrine B / Schublade 4 / Regal 2 Fach 1 / Box 07</p>
              </div>

              {/* Foto */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Foto des Lagerorts <span className="font-normal normal-case text-zinc-300">optional</span></label>
                {storageForm.photo ? (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={storageForm.photo} alt="Lagerort" className="w-full max-h-48 object-cover" />
                    <button
                      onClick={() => setStorageForm((f) => ({ ...f, photo: "" }))}
                      className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-8 hover:border-zinc-300 hover:bg-zinc-50 transition-colors">
                    <span className="text-3xl">📷</span>
                    <span className="text-[12px] font-medium text-zinc-500">Foto hochladen</span>
                    <span className="text-[10px] text-zinc-300">JPG, PNG bis 5 MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setStorageForm((f) => ({ ...f, photo: ev.target?.result as string }));
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                )}
              </div>

              {/* Quick-Vorschläge */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Schnellauswahl</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Vitrine A", "Vitrine B", "Vitrine C", "Schublade 1", "Schublade 2", "Schublade 3", "Regal 1", "Regal 2", "Box 01", "Box 02", "Tresor"].map((loc) => (
                    <button key={loc} type="button"
                      onClick={() => setStorageForm((f) => ({ ...f, location: loc }))}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${storageForm.location === loc ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 p-4 flex gap-3">
              <Button onClick={handleSaveStorage} disabled={storageSaving} className="flex-1 h-11 text-[14px] font-semibold bg-amber-500 hover:bg-amber-600">
                {storageSaving ? "Speichert…" : "💾 Lagerort speichern"}
              </Button>
              <Button variant="secondary" onClick={() => setShowStorageModal(false)} className="h-11 px-5">
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {editingSale && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingSale(null); }}
        >
          <div className="w-full max-w-lg rounded-t-3xl bg-white sm:rounded-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <h3 className="text-[15px] font-semibold text-zinc-900">Verkauf bearbeiten</h3>
              <button onClick={() => setEditingSale(null)} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100">
                <X size={18} />
              </button>
            </div>
            <form id="edit-sale-form" onSubmit={handleEditSale} className="overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Verkaufspreis (€)</label>
                  <Input type="number" step="0.01" min="0" value={editForm.salePrice} onChange={(e) => setEditForm((f) => ({ ...f, salePrice: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Menge</label>
                  <Input type="number" min="1" value={editForm.quantitySold} onChange={(e) => setEditForm((f) => ({ ...f, quantitySold: e.target.value }))} required />
                </div>
              </div>

              {/* ── Live-Vorschau ── */}
              {(() => {
                const price = parseFloat(editForm.salePrice || "0");
                const qty = parseInt(editForm.quantitySold || "1");
                const shipping = parseFloat(editForm.shippingCost || "0");
                const packaging = parseFloat(editForm.packagingCost || "0");
                const gross = price * qty;
                const costs = shipping + packaging;
                const net = gross - costs;
                if (!price || !qty) return null;
                return (
                  <div className="rounded-xl bg-zinc-950 px-4 py-3 text-white flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Gesamt (brutto)</p>
                      <p className="text-[20px] font-black tracking-tight leading-none mt-0.5">{formatCurrency(gross)}</p>
                    </div>
                    {costs > 0 && (
                      <div className="text-right">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Netto</p>
                        <p className="text-[20px] font-black tracking-tight leading-none mt-0.5 text-emerald-400">{formatCurrency(net)}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">− {formatCurrency(costs)} Versand</p>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Kunde</label>
                  <Input placeholder="Kundenname" value={editForm.customerName} onChange={(e) => setEditForm((f) => ({ ...f, customerName: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Rechnungsnr.</label>
                  <Input placeholder="optional" value={editForm.invoiceNumber} onChange={(e) => setEditForm((f) => ({ ...f, invoiceNumber: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Zahlungsart</label>
                  <Input placeholder="z.B. Bar, PayPal" value={editForm.paymentMethod} onChange={(e) => setEditForm((f) => ({ ...f, paymentMethod: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Plattform</label>
                  <Input placeholder="z.B. eBay, Shopify" value={editForm.marketplace} onChange={(e) => setEditForm((f) => ({ ...f, marketplace: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Versandkosten (€)</label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={editForm.shippingCost} onChange={(e) => setEditForm((f) => ({ ...f, shippingCost: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Verpackung (€)</label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={editForm.packagingCost} onChange={(e) => setEditForm((f) => ({ ...f, packagingCost: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Versanddienstleister</label>
                  <Input placeholder="DHL, Hermes…" value={editForm.shippingCarrier} onChange={(e) => setEditForm((f) => ({ ...f, shippingCarrier: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Sendungsnummer</label>
                  <Input placeholder="Trackingnummer" value={editForm.trackingNumber} onChange={(e) => setEditForm((f) => ({ ...f, trackingNumber: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Lieferadresse</label>
                <textarea
                  rows={3}
                  placeholder={"Max Mustermann\nMusterstraße 1\n12345 Berlin"}
                  value={editForm.shippingAddress}
                  onChange={(e) => setEditForm((f) => ({ ...f, shippingAddress: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[13px] text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 resize-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Notiz</label>
                <Input placeholder="optional" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Verkaufsdatum</label>
                <Input type="date" value={editForm.soldAt} onChange={(e) => setEditForm((f) => ({ ...f, soldAt: e.target.value }))} />
              </div>
            </form>
            <div className="border-t border-zinc-100 p-4 flex gap-3">
              <Button type="submit" form="edit-sale-form" disabled={editSaving} className="flex-1 h-11 text-[14px] font-semibold">
                {editSaving ? "Speichern..." : "Änderungen speichern"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditingSale(null)} className="h-11">
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
