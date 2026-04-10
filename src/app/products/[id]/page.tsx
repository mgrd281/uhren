"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  PageHeader,
  Card,
  Badge,
  Button,
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
import { ArrowRight, Trash2, Edit, Watch, ShoppingBag } from "lucide-react";
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

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => setProduct(d))
      .finally(() => setLoading(false));
  }, [id]);

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
            <Card className="!p-4">
              <p className="text-[11px] text-zinc-400">Einkaufspreis</p>
              <p className="text-lg font-bold text-zinc-900">
                {formatCurrency(product.costPrice)}
              </p>
            </Card>
            <Card className="!p-4">
              <p className="text-[11px] text-zinc-400">Erwarteter VK-Preis</p>
              <p className="text-lg font-bold text-zinc-900">
                {formatCurrency(product.salePriceExpected)}
              </p>
            </Card>
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
                        {sale.invoiceNumber && ` · ${sale.invoiceNumber}`}
                      </p>
                    </div>
                    <p className="text-[15px] font-bold text-zinc-900">
                      {formatCurrency(sale.totalAmount)}
                    </p>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
