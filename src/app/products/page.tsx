"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PageHeader, Badge, Button, Input, EmptyState, Skeleton } from "@/components/ui";
import {
  formatCurrency,
  stockStatusLabel,
  stockStatusColor,
} from "@/lib/utils";
import { Plus, Search, Watch } from "lucide-react";

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
  _count: { sales: number };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/products${q}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setProducts(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Produkte"
        description={`${products.length} Produkte im Bestand`}
        actions={
          <Link href="/products/add">
            <Button>
              <Plus size={16} />
              Produkt hinzufügen
            </Button>
          </Link>
        }
      />

      <div className="max-w-md">
        <Input
          placeholder="Suche nach Name, Marke oder SKU..."
          value={search}
          onChange={(e) => {
            setLoading(true);
            setSearch(e.target.value);
          }}
          className="w-full"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Watch size={48} />}
          title="Keine Produkte"
          description="Fügen Sie Ihre erste Uhr zum Bestand hinzu"
          action={
            <Link href="/products/add">
              <Button>
                <Plus size={16} />
                Produkt hinzufügen
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-zinc-50">
                {p.mainImage ? (
                  <Image
                    src={p.mainImage}
                    alt={p.name}
                    fill
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    unoptimized={p.mainImage.startsWith("data:")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Watch size={40} className="text-zinc-200" />
                  </div>
                )}
                <div className="absolute start-3 top-3">
                  <Badge className={stockStatusColor(p.status)}>
                    {stockStatusLabel(p.status)}
                  </Badge>
                </div>
              </div>

              {/* Details */}
              <div className="p-5">
                <p className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                  {p.brand}
                </p>
                <h3 className="mt-1 text-[15px] font-semibold text-zinc-900 line-clamp-1">
                  {p.name}
                </h3>
                <p className="mt-0.5 text-[12px] text-zinc-400">
                  {p.model} · {p.sku}
                </p>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[11px] text-zinc-400">Verkaufspreis</p>
                    <p className="text-lg font-bold text-zinc-900">
                      {formatCurrency(p.salePriceExpected)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] text-zinc-400">Bestand</p>
                    <p className="text-lg font-bold text-zinc-900">
                      {p.quantity}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
