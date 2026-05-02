"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/product-form";
import { Skeleton } from "@/components/ui";
import { useRole } from "@/lib/useRole";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { canEdit } = useRole();
  const router = useRouter();
  const [data, setData] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!canEdit) { router.replace(`/products/${id}`); return; }
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((p) =>
        setData({
          name: p.name,
          brand: p.brand,
          model: p.model,
          sku: p.sku,
          category: p.category,
          color: p.color,
          description: p.description,
          costPrice: String(p.costPrice),
          salePriceExpected: String(p.salePriceExpected),
          quantity: String(p.quantity),
          lowStockThreshold: String(p.lowStockThreshold),
          mainImage: p.mainImage ?? "",
          ebayStatus: p.ebayStatus ?? "Nicht gepostet",
          notes: p.notes ?? "",
          kartonAnzahl: String(p.kartonAnzahl ?? 0),
        })
      );
  }, [id, canEdit, router]);

  if (!canEdit) return null;

  if (!data)
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );

  return <ProductForm initialData={data} productId={id} />;
}
