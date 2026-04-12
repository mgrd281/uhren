"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Textarea, Select, PageHeader } from "@/components/ui";
import { toast } from "sonner";
import { Save, Upload, X, Check, Loader2 } from "lucide-react";
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
  ebayStatus: string;
  notes: string;
}

const EBAY_STATUSES = ["Nicht gepostet", "eBay Kleinanzeige"];

const CATEGORIES = [
  "Armbanduhr",
  "Chronograph",
  "Automatik",
  "Quarz",
  "Smartwatch",
  "Zubehör",
  "Sonstige",
];

const BRANDS = [
  "Michael Kors",
  "BOSS",
  "Emporio Armani",
  "Armani Exchange",
  "Daniel Wellington",
  "Maserati",
  "Diesel",
  "Rolex",
  "Omega",
  "Sonstige",
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
    ebayStatus: "Nicht gepostet",
    notes: "",
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const hasChanged = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateField(key: keyof ProductFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    if (isEdit) hasChanged.current = true;
  }

  const autoSave = useCallback(async (formData: ProductFormData) => {
    if (!isEdit || !productId) return;
    setAutoSaveStatus("saving");
    const payload = {
      ...formData,
      costPrice: parseFloat(formData.costPrice) || 0,
      salePriceExpected: parseFloat(formData.salePriceExpected) || 0,
      quantity: parseInt(formData.quantity, 10) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 0,
      mainImage: formData.mainImage || null,
      notes: formData.notes || null,
    };
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      } else {
        setAutoSaveStatus("idle");
      }
    } catch {
      setAutoSaveStatus("idle");
    }
  }, [isEdit, productId]);

  useEffect(() => {
    if (!isEdit || !hasChanged.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      autoSave(form);
    }, 1200);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [form, isEdit, autoSave]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Nur JPEG, PNG oder WebP erlaubt");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Maximal 10 MB");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await compressImage(file, 800, 0.75);
      updateField("mainImage", dataUrl);
      toast.success("Bild geladen");
    } catch {
      toast.error("Bild konnte nicht geladen werden");
    } finally {
      setUploading(false);
    }
  }

  function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas error"));
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
          toast.error(data.error || "Speichern fehlgeschlagen");
        }
        setSaving(false);
        return;
      }

      toast.success(isEdit ? "Produkt aktualisiert" : "Produkt hinzugefügt");
      router.push(`/products/${data.id}`);
    } catch {
      toast.error("Verbindungsfehler");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={isEdit ? "Produkt bearbeiten" : "Neues Produkt hinzufügen"}
        description={
          isEdit
            ? "Änderungen werden automatisch gespeichert"
            : "Fügen Sie eine neue Uhr zum Bestand hinzu"
        }
      />

      {isEdit && autoSaveStatus !== "idle" && (
        <div className="flex items-center gap-2 text-sm">
          {autoSaveStatus === "saving" && (
            <>
              <Loader2 size={14} className="animate-spin text-zinc-400" />
              <span className="text-zinc-400">Speichern...</span>
            </>
          )}
          {autoSaveStatus === "saved" && (
            <>
              <Check size={14} className="text-emerald-500" />
              <span className="text-emerald-500">Gespeichert</span>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <Card>
          <h3 className="mb-6 text-sm font-semibold text-zinc-700">
            Grundinformationen
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Produktname"
              placeholder="z.B. Rolex Submariner"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              error={errors.name}
              required
            />
            <Select
              label="Marke"
              value={form.brand}
              onChange={(e) => updateField("brand", e.target.value)}
              error={errors.brand}
              required
            >
              <option value="">Marke auswählen</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
            <Input
              label="Modell"
              placeholder="z.B. 126610LN"
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
              error={errors.model}
              required
            />
            <Input
              label="Artikelnummer (SKU)"
              placeholder="z.B. RLX-SUB-001"
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              error={errors.sku}
              required
            />
            <Select
              label="Kategorie"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              error={errors.category}
              required
            >
              <option value="">Kategorie auswählen</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Input
              label="Farbe"
              placeholder="z.B. Schwarz"
              value={form.color}
              onChange={(e) => updateField("color", e.target.value)}
              error={errors.color}
            />
          </div>
          <div className="mt-5">
            <Textarea
              label="Beschreibung"
              placeholder="Detaillierte Beschreibung der Uhr..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              error={errors.description}
            />
          </div>
        </Card>

        {/* Pricing + stock */}
        <Card>
          <h3 className="mb-6 text-sm font-semibold text-zinc-700">
            Preise und Bestand
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Einkaufspreis (EUR)"
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => updateField("costPrice", e.target.value)}
              error={errors.costPrice}
              required
            />
            <Input
              label="Erwarteter VK-Preis (EUR)"
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
              label="Menge"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              error={errors.quantity}
              required
            />
            <Input
              label="Warngrenze (niedriger Bestand)"
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
            Produktbild
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
                  unoptimized={form.mainImage.startsWith("data:")}
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
                label="Bild-URL"
                placeholder="https://..."
                value={form.mainImage}
                onChange={(e) => updateField("mainImage", e.target.value)}
              />
              <div className="mt-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-[12px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50">
                  <Upload size={14} />
                  {uploading ? "Wird hochgeladen..." : "Bild hochladen"}
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
            label="Notizen"
            placeholder="Interne Notizen..."
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </Card>

        {/* eBay Kleinanzeigen Status */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-zinc-700">
            eBay Kleinanzeigen
          </h3>
          <div className="flex gap-3">
            {EBAY_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => updateField("ebayStatus", status)}
                className={`rounded-xl border px-5 py-2.5 text-[13px] font-medium transition-all ${
                  form.ebayStatus === status
                    ? status === "eBay Kleinanzeige"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-zinc-800 bg-zinc-800 text-white"
                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            {isEdit ? "Zurück" : "Abbrechen"}
          </Button>
          {!isEdit && (
            <Button type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Speichern..." : "Produkt hinzufügen"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
