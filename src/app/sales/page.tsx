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
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/sales").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([s, p]) => {
        setSales(s);
        setProducts(p);
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
        toast.error(data.error || "فشل تسجيل البيع");
        setSaving(false);
        return;
      }

      toast.success("تم تسجيل البيع بنجاح");
      setShowForm(false);
      setForm({
        productId: "",
        quantitySold: "1",
        salePrice: "",
        customerName: "",
        invoiceNumber: "",
        notes: "",
      });

      // Refresh
      const [s, p] = await Promise.all([
        fetch("/api/sales").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
      ]);
      setSales(s);
      setProducts(p);
    } catch {
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === form.productId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="المبيعات"
        description={`${sales.length} عملية بيع مسجلة`}
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "إلغاء" : "تسجيل بيع جديد"}
          </Button>
        }
      />

      {/* New sale form */}
      {showForm && (
        <Card className="border-zinc-200 shadow-md">
          <h3 className="mb-6 text-sm font-semibold text-zinc-700">
            تسجيل بيع جديد
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                label="المنتج"
                value={form.productId}
                onChange={(e) => onProductSelect(e.target.value)}
                required
              >
                <option value="">اختر المنتج</option>
                {products
                  .filter((p) => p.quantity > 0)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand} - {p.name} (متوفر: {p.quantity})
                    </option>
                  ))}
              </Select>
              <Input
                label="الكمية"
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
                label="سعر البيع (AED)"
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
                label="اسم العميل (اختياري)"
                value={form.customerName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customerName: e.target.value }))
                }
              />
              <Input
                label="رقم الفاتورة (اختياري)"
                value={form.invoiceNumber}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    invoiceNumber: e.target.value,
                  }))
                }
              />
            </div>
            <Textarea
              label="ملاحظات"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />

            {selectedProduct && form.salePrice && (
              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-[12px] text-zinc-400">ملخص العملية</p>
                <p className="mt-1 text-lg font-bold text-zinc-900">
                  الإجمالي:{" "}
                  {formatCurrency(
                    parseInt(form.quantitySold) * parseFloat(form.salePrice)
                  )}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "جاري التسجيل..." : "تسجيل البيع"}
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
          title="لا توجد مبيعات"
          description="قم بتسجيل أول عملية بيع"
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
                  {sale.product.brand} · {sale.quantitySold} قطعة ×{" "}
                  {formatCurrency(sale.salePrice)}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {formatDateTime(sale.soldAt)}
                  {sale.customerName && ` · ${sale.customerName}`}
                  {sale.invoiceNumber && ` · ${sale.invoiceNumber}`}
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
