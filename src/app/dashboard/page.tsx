"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Skeleton } from "@/components/ui";
import { formatCurrency, formatNumber, formatDateTime, stockStatusLabel, stockStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Package,
  Warehouse,
  AlertTriangle,
  XCircle,
  DollarSign,
  TrendingUp,
  Receipt,
  Gem,
  ArrowUpRight,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";

interface DashboardData {
  kpis: {
    totalProducts: number;
    totalStock: number;
    lowStockItems: number;
    outOfStockItems: number;
    inventoryValueCost: number;
    expectedSalesValue: number;
    totalRevenue: number;
    totalProfit: number;
  };
  charts: {
    salesOverTime: { month: string; revenue: number; profit: number }[];
    topProducts: { name: string; totalSold: number; revenue: number }[];
    topBrands: { brand: string; revenue: number }[];
  };
  recentSales: {
    id: string;
    totalAmount: number;
    quantitySold: number;
    salePrice: number;
    customerName: string | null;
    invoiceNumber: string | null;
    soldAt: string;
    product: { name: string; brand: string };
    productId?: string;
  }[];
  alerts: {
    id: string;
    name: string;
    brand: string;
    quantity: number;
    status: string;
  }[];
}

const COLORS = ["#18181b", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d && d.kpis) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-24 min-w-[140px] flex-1" />))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-20" />))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;
  const { kpis, charts, recentSales, alerts } = data;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          Dashboard
        </h1>
        <p className="mt-0.5 text-[12px] text-zinc-400">
          Übersicht
        </p>
      </div>

      {/* ── Revenue Summary (static grid) ── */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/sales"
          className="flex flex-col rounded-2xl bg-zinc-900 px-3.5 py-3 text-white transition-all active:scale-[0.98]"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Umsatz
          </span>
          <span className="mt-1 text-[16px] font-bold tracking-tight sm:text-lg">
            {formatCurrency(kpis.totalRevenue)}
          </span>
          <span className="mt-0.5 flex items-center gap-0.5 text-[9px] text-zinc-500">
            Ansehen <ChevronRight size={9} />
          </span>
        </Link>
        <Link
          href="/sales"
          className="flex flex-col rounded-2xl border border-zinc-100 bg-white px-3.5 py-3 shadow-sm transition-all active:scale-[0.98]"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Gewinn
          </span>
          <span className="mt-1 text-[16px] font-bold tracking-tight text-emerald-600 sm:text-lg">
            {formatCurrency(kpis.totalProfit)}
          </span>
        </Link>
        <Link
          href="/products"
          className="flex flex-col rounded-2xl border border-zinc-100 bg-white px-3.5 py-3 shadow-sm transition-all active:scale-[0.98]"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Bestandswert
          </span>
          <span className="mt-1 text-[16px] font-bold tracking-tight text-zinc-900 sm:text-lg">
            {formatCurrency(kpis.expectedSalesValue)}
          </span>
        </Link>
      </div>

      {/* ── KPI Grid (clickable) ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/products"
          className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-all active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
            <Package size={18} className="text-zinc-600" />
          </div>
          <div>
            <p className="text-[18px] font-bold tracking-tight text-zinc-900">{formatNumber(kpis.totalProducts)}</p>
            <p className="text-[11px] text-zinc-400">Produkte</p>
          </div>
        </Link>
        <Link
          href="/products"
          className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-all active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <Warehouse size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[18px] font-bold tracking-tight text-zinc-900">{formatNumber(kpis.totalStock)}</p>
            <p className="text-[11px] text-zinc-400">Auf Lager</p>
          </div>
        </Link>
        {kpis.lowStockItems > 0 && (
          <Link
            href="/products"
            className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 transition-all active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[18px] font-bold tracking-tight text-amber-700">{formatNumber(kpis.lowStockItems)}</p>
              <p className="text-[11px] text-amber-600">Niedrig</p>
            </div>
          </Link>
        )}
        {kpis.outOfStockItems > 0 && (
          <Link
            href="/products"
            className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-4 transition-all active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <XCircle size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-[18px] font-bold tracking-tight text-red-700">{formatNumber(kpis.outOfStockItems)}</p>
              <p className="text-[11px] text-red-600">Ausverkauft</p>
            </div>
          </Link>
        )}
      </div>

      {/* ── Sales Chart ── */}
      {charts.salesOverTime.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-zinc-900">Umsatzverlauf</h3>
            <Link href="/reports" className="text-[11px] font-medium text-zinc-400 transition-colors active:text-zinc-600">
              Details →
            </Link>
          </div>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.salesOverTime}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18181b" stopOpacity={0.12} /><stop offset="100%" stopColor="#18181b" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.12} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} width={50} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f4f4f5", fontSize: 11 }} />
                <Area type="monotone" dataKey="revenue" stroke="#18181b" strokeWidth={2} fill="url(#gRev)" name="Umsatz" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#gProfit)" name="Gewinn" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Top Brands + Top Products side by side on desktop ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {charts.topBrands.length > 0 && (
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-[13px] font-bold text-zinc-900">Top Marken</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.topBrands} dataKey="revenue" nameKey="brand" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={2} label={({ name }: { name?: string }) => name ?? ""} style={{ fontSize: 10 }}>
                    {charts.topBrands.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f4f4f5", fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {charts.topProducts.length > 0 && (
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-[13px] font-bold text-zinc-900">Meistverkauft</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#71717a" }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f4f4f5", fontSize: 11 }} />
                  <Bar dataKey="revenue" fill="#18181b" radius={[0, 6, 6, 0]} name="Umsatz" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Sales (clickable) ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-zinc-900">Letzte Verkäufe</h3>
          <Link href="/sales" className="text-[11px] font-medium text-zinc-400 transition-colors active:text-zinc-600">
            Alle ansehen →
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <ShoppingBag size={20} className="text-zinc-400" />
            </div>
            <p className="text-[12px] text-zinc-400">Noch keine Verkäufe</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-100 bg-white divide-y divide-zinc-100 overflow-hidden shadow-sm">
            {recentSales.map((sale) => (
              <Link
                key={sale.id}
                href={sale.productId ? `/products/${sale.productId}` : "/sales"}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-zinc-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <ArrowUpRight size={18} className="text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-zinc-900">
                    {sale.product.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {sale.product.brand}
                    {sale.customerName && ` · ${sale.customerName}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-bold text-zinc-900">
                    +{formatCurrency(sale.totalAmount)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-400">
                    {new Date(sale.soldAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Alerts (clickable) ── */}
      {alerts.length > 0 && (
        <div>
          <h3 className="mb-3 text-[13px] font-bold text-zinc-900">⚠️ Bestandswarnungen</h3>
          <div className="rounded-2xl border border-zinc-100 bg-white divide-y divide-zinc-100 overflow-hidden shadow-sm">
            {alerts.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-zinc-50"
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  p.status === "OUT_OF_STOCK" ? "bg-red-50" : "bg-amber-50"
                )}>
                  {p.status === "OUT_OF_STOCK"
                    ? <XCircle size={18} className="text-red-500" />
                    : <AlertTriangle size={18} className="text-amber-500" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-zinc-900">{p.name}</p>
                  <p className="text-[11px] text-zinc-400">{p.brand}</p>
                </div>
                <div className="shrink-0">
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold",
                    p.status === "OUT_OF_STOCK"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-600"
                  )}>
                    {p.quantity} Stk.
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
