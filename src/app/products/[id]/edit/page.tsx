"use client";

import { useEffect, useState, use } from "react";
import ProductForm from "@/components/product-form";
import { Skeleton } from "@/components/ui";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<Record<string, string> | null>(null);

  useEffect(() => {
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
          shopifyStatus: p.shopifyStatus ?? "Nicht gepostet",
          notes: p.notes ?? "",
        })
      );
  }, [id]);

  if (!data)
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );

  return <ProductForm initialData={data} productId={id} />;
}
