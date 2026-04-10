"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Textarea, Select, PageHeader } from "@/components/ui";
import { toast } from "sonner";
import { Save, Upload, X } from "lucide-react";
import Image from "next/image";

interface ProductFormData {
  name: string;
  brand: string;
  model: string;
  sku: string;
  category: string;
  color: string;
  description: string;
  costPrice: string;
  salePriceExpected: string;
  quantity: string;
  lowStockThreshold: string;
  mainImage: string;
  notes: string;
}

const CATEGORIES = [
  "Dive",
  "Sport Luxury",
  "Dress",
  "Icon",
  "Chronograph",
  "Pilot",
  "Field",
  "Complications",
  "أخرى",
];

const BRANDS = [
  "Rolex",
  "Patek Philippe",
  "Audemars Piguet",
  "Richard Mille",
  "Omega",
  "Cartier",
  "IWC",
  "Jaeger-LeCoultre",
  "Vacheron Constantin",
  "A. Lange & Söhne",
  "أخرى",
];

export default function ProductForm({
  initialData,
  productId,
}: {
  initialData?: Partial<ProductFormData>;
  productId?: string;
}) {
  const router = useRouter();
  const isEdit = !!productId;

  const [form, setForm] = useState<ProductFormData>({
    name: "",
    brand: "",
    model: "",
    sku: "",
    category: "",
    color: "",
    description: "",
    costPrice: "",
    salePriceExpected: "",
    quantity: "0",
    lowStockThreshold: "2",
    mainImage: "",
    notes: "",
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function updateField(key: keyof ProductFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        updateField("mainImage", data.url);
        toast.success("تم رفع الصورة");
      } else {
        toast.error(data.error || "فشل رفع الصورة");
      }
    } catch {
      toast.error("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      ...form,
      costPrice: parseFloat(form.costPrice),
      salePriceExpected: parseFloat(form.salePriceExpected),
      quantity: parseInt(form.quantity, 10),
      lowStockThreshold: parseInt(form.lowStockThreshold, 10),
      mainImage: form.mainImage || null,
      notes: form.notes || null,
    };

    try {
      const url = isEdit ? `/api/products/${productId}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(data.error.fieldErrors)) {
            fieldErrors[key] = (msgs as string[])[0];
          }
          setErrors(fieldErrors);
        } else {
          toast.error(data.error || "خطأ في الحفظ");
        }
        setSaving(false);
        return;
      }

      toast.success(isEdit ? "تم تحديث المنتج" : "تم إضافة المنتج");
      router.push(`/products/${data.id}`);
    } catch {
      toast.error("خطأ في الاتصال بالخادم");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={isEdit ? "تعديل المنتج" : "إضافة منتج جديد"}
        description={
          isEdit
            ? "قم بتحديث بيانات المنتج"
            : "أضف ساعة جديدة إلى مخزونك"
        }
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <Card>
          <h3 className="mb-6 text-sm font-semibold text-zinc-700">
            المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="اسم المنتج"
              placeholder="مثال: Rolex Submariner"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              error={errors.name}
              required
            />
            <Select
              label="العلامة التجارية"
              value={form.brand}
              onChange={(e) => updateField("brand", e.target.value)}
              error={errors.brand}
              required
            >
              <option value="">اختر العلامة التجارية</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
            <Input
              label="الموديل"
              placeholder="مثال: 126610LN"
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
              error={errors.model}
              required
            />
            <Input
              label="رقم المنتج (SKU)"
              placeholder="مثال: RLX-SUB-001"
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              error={errors.sku}
              required
            />
            <Select
              label="الفئة"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              error={errors.category}
              required
            >
              <option value="">اختر الفئة</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Input
              label="اللون"
              placeholder="مثال: أسود"
              value={form.color}
              onChange={(e) => updateField("color", e.target.value)}
              error={errors.color}
              required
            />
          </div>
          <div className="mt-5">
            <Textarea
              label="الوصف"
              placeholder="وصف تفصيلي للساعة..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              error={errors.description}
              required
            />
          </div>
        </Card>

        {/* Pricing + stock */}
        <Card>
          <h3 className="mb-6 text-sm font-semibold text-zinc-700">
            التسعير والمخزون
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="سعر التكلفة (AED)"
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => updateField("costPrice", e.target.value)}
              error={errors.costPrice}
              required
            />
            <Input
              label="سعر البيع المتوقع (AED)"
              type="number"
              min="0"
              step="0.01"
              value={form.salePriceExpected}
              onChange={(e) =>
                updateField("salePriceExpected", e.target.value)
              }
              error={errors.salePriceExpected}
              required
            />
            <Input
              label="الكمية"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              error={errors.quantity}
              required
            />
            <Input
              label="حد التنبيه (مخزون منخفض)"
              type="number"
              min="0"
              value={form.lowStockThreshold}
              onChange={(e) =>
                updateField("lowStockThreshold", e.target.value)
              }
            />
          </div>
        </Card>

        {/* Image */}
        <Card>
          <h3 className="mb-6 text-sm font-semibold text-zinc-700">
            صورة المنتج
          </h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {form.mainImage && (
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-zinc-50">
                <Image
                  src={form.mainImage}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
                <button
                  type="button"
                  onClick={() => updateField("mainImage", "")}
                  className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-110"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <div>
              <Input
                label="رابط الصورة (URL)"
                placeholder="https://..."
                value={form.mainImage}
                onChange={(e) => updateField("mainImage", e.target.value)}
              />
              <div className="mt-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-[12px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50">
                  <Upload size={14} />
                  {uploading ? "جاري الرفع..." : "رفع صورة"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <Textarea
            label="ملاحظات"
            placeholder="ملاحظات داخلية..."
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={saving}>
            <Save size={16} />
            {saving
              ? "جاري الحفظ..."
              : isEdit
              ? "حفظ التعديلات"
              : "إضافة المنتج"}
          </Button>
        </div>
      </form>
    </div>
  );
}
