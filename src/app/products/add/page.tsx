"use client";

import { useRole } from "@/lib/useRole";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProductForm from "@/components/product-form";

export default function AddProductPage() {
  const { canEdit } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!canEdit) router.replace("/products");
  }, [canEdit, router]);

  if (!canEdit) return null;
  return <ProductForm />;
}
