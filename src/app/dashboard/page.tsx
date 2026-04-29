"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Package,
  Warehouse,
  AlertTriangle,
  XCircle,
  // TrendingUp removed
  Gem,
  ArrowUpRight,
  ShoppingBag,
  Activity,
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
    revenueLast30Days: number;
    revenueLast60Days: number;
  };
  charts: {
    salesOverTime: { month: string; revenue: number; profit: number }[];
    topProducts: { name: string; totalSold: number; revenue: number }[];
    topBrands: { brand: string; revenue: number }[];
    inventoryByBrand: { brand: string; value: number; stock: number; sold: number }[];
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
  const [revPeriod, setRevPeriod] = useState<"all" | "30" | "60">("all");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d && d.kpis) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-52" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!data) return null;
  const { kpis, charts, recentSales, alerts } = data;

  const displayRevenue =
    revPeriod === "all" ? kpis.totalRevenue :
    revPeriod === "30" ? kpis.revenueLast30Days :
    kpis.revenueLast60Days;

  const periodLabel =
    revPeriod === "all" ? "Alle Verkäufe" :
    revPeriod === "30" ? "Letzte 30 Tage" :
    "Letzte 60 Tage";

  return (
    <div className="space-y-6 lg:space-y-7 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Luxusuhren</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-900 lg:text-3xl">Dashboard</h1>
        </div>
        <p className="hidden text-[12px] font-medium text-zinc-400 lg:block">
          {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Hero Revenue Row ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* Revenue hero with period toggle */}
        <div className="group relative overflow-hidden rounded-2xl bg-zinc-900 p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-900/30 lg:p-6">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
          <div className="absolute -right-2 -bottom-8 h-20 w-20 rounded-full bg-white/5" />

          {/* Period buttons */}
          <div className="relative mb-4 flex gap-1.5">
            {(["all", "30", "60"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setRevPeriod(p)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                  revPeriod === p
                    ? "bg-white text-zinc-900"
                    : "bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white"
                )}
              >
                {p === "all" ? "Umsatz" : p === "30" ? "Letzte 30 Tage" : "Letzte 60 Tage"}
              </button>
            ))}
          </div>

          <p className="relative text-3xl font-bold tracking-tight text-white lg:text-4xl">
            {formatCurrency(displayRevenue)}
          </p>
          <div className="relative mt-3 flex items-center gap-1.5">
            <Activity size={11} className="text-zinc-500" />
            <p className="text-[11px] text-zinc-500">{periodLabel}</p>
          </div>
        </div>

        {/* Inventory value */}
        <Link href="/products"
          className="group flex flex-col rounded-2xl border border-zinc-100 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:shadow-zinc-100 hover:-translate-y-0.5 active:scale-[0.98] sm:col-span-2 lg:p-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Bestandswert</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100">
              <Gem size={14} className="text-zinc-500" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 lg:text-3xl">{formatCurrency(kpis.expectedSalesValue)}</p>

          {/* Brand breakdown */}
          {charts.inventoryByBrand.length > 0 && (
            <div className="mt-4 space-y-3">
              {charts.inventoryByBrand.map((b) => {
                const totalItems = b.stock + b.sold;
                const soldPct = totalItems > 0 ? Math.round((b.sold / totalItems) * 100) : 0;
                return (
                  <div key={b.brand}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold text-zinc-700 max-w-[55%]">{b.brand}</span>
                      <span className="shrink-0 text-[10px] font-medium text-zinc-400">{formatCurrency(b.value)}</span>
                    </div>
                    {/* progress bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-900 transition-all"
                        style={{ width: `${Math.round((b.value / kpis.expectedSalesValue) * 100)}%` }}
                      />
                    </div>
                    {/* sold / remaining chips */}
                    <div className="mt-1 flex gap-2">
                      <span className="text-[10px] text-zinc-400">
                        <span className="font-semibold text-emerald-600">{b.sold}</span> verkauft
                      </span>
                      <span className="text-zinc-200">·</span>
                      <span className="text-[10px] text-zinc-400">
                        <span className="font-semibold text-zinc-700">{b.stock}</span> im Bestand
                      </span>
                      {soldPct > 0 && (
                        <>
                          <span className="text-zinc-200">·</span>
                          <span className="text-[10px] font-semibold text-blue-500">{soldPct}% verkauft</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Link>
      </div>

      {/* ── 4 KPI Chips ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Link href="/products"
          className="group flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3.5 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 transition-colors group-hover:bg-zinc-900">
            <Package size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-[18px] font-bold leading-none text-zinc-900">{formatNumber(kpis.totalProducts)}</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">Produkte</p>
          </div>
        </Link>

        <Link href="/products"
          className="group flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3.5 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 transition-colors group-hover:bg-blue-600">
            <Warehouse size={16} className="text-blue-500 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-[18px] font-bold leading-none text-zinc-900">{formatNumber(kpis.totalStock)}</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">Auf Lager</p>
          </div>
        </Link>

        <Link href="/products"
          className={cn(
            "group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
            kpis.lowStockItems > 0 ? "border-amber-100 bg-amber-50/60" : "border-zinc-100 bg-white"
          )}>
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
            kpis.lowStockItems > 0 ? "bg-amber-100 group-hover:bg-amber-500" : "bg-zinc-100 group-hover:bg-zinc-900")}>
            <AlertTriangle size={16} className={cn("transition-colors", kpis.lowStockItems > 0 ? "text-amber-600 group-hover:text-white" : "text-zinc-500 group-hover:text-white")} />
          </div>
          <div>
            <p className={cn("text-[18px] font-bold leading-none", kpis.lowStockItems > 0 ? "text-amber-700" : "text-zinc-900")}>{formatNumber(kpis.lowStockItems)}</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">Niedrig</p>
          </div>
        </Link>

        <Link href="/products"
          className={cn(
            "group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
            kpis.outOfStockItems > 0 ? "border-red-100 bg-red-50/60" : "border-zinc-100 bg-white"
          )}>
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
            kpis.outOfStockItems > 0 ? "bg-red-100 group-hover:bg-red-500" : "bg-zinc-100 group-hover:bg-zinc-900")}>
            <XCircle size={16} className={cn("transition-colors", kpis.outOfStockItems > 0 ? "text-red-500 group-hover:text-white" : "text-zinc-500 group-hover:text-white")} />
          </div>
          <div>
            <p className={cn("text-[18px] font-bold leading-none", kpis.outOfStockItems > 0 ? "text-red-600" : "text-zinc-900")}>{formatNumber(kpis.outOfStockItems)}</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">Ausverkauft</p>
          </div>
        </Link>
      </div>

      {/* ── Sales Chart ── */}
      {charts.salesOverTime.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm lg:p-7">
          <div className="mb-5 flex items-start justify-between lg:mb-7">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 lg:text-base">Umsatzverlauf</h3>
              <p className="mt-0.5 text-[11px] text-zinc-400">Umsatz &amp; Gewinn der letzten Monate</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="hidden items-center gap-4 lg:flex">
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="inline-block h-2 w-5 rounded-full bg-zinc-900" /> Umsatz
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="inline-block h-2 w-5 rounded-full bg-emerald-500" /> Gewinn
                </span>
              </div>
              <Link href="/reports" className="rounded-lg bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 transition hover:bg-zinc-200">
                Details →
              </Link>
            </div>
          </div>
          <div className="h-56 sm:h-72 lg:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.salesOverTime} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#18181b" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#18181b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} width={48} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #f4f4f5", fontSize: 11, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "8px 12px" }}
                  cursor={{ stroke: "#e4e4e7", strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#18181b" strokeWidth={2} fill="url(#gRev)" name="Umsatz" dot={false} />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#gProfit)" name="Gewinn" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      {(charts.topBrands.length > 0 || charts.topProducts.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {charts.topBrands.length > 0 && (
            <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm lg:p-6">
              <h3 className="mb-1 text-sm font-bold text-zinc-900">Top Marken</h3>
              <p className="mb-4 text-[11px] text-zinc-400">Umsatz nach Marke</p>
              <div className="h-52 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.topBrands} dataKey="revenue" nameKey="brand" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={3}
                      label={({ name }: { name?: string }) => name ?? ""} labelLine={false} style={{ fontSize: 10 }}>
                      {charts.topBrands.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #f4f4f5", fontSize: 11, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {charts.topProducts.length > 0 && (
            <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm lg:p-6">
              <h3 className="mb-1 text-sm font-bold text-zinc-900">Meistverkauft</h3>
              <p className="mb-4 text-[11px] text-zinc-400">Top Produkte nach Umsatz</p>
              <div className="h-52 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.topProducts} layout="vertical" margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#71717a" }} width={95} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #f4f4f5", fontSize: 11, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} />
                    <Bar dataKey="revenue" fill="#18181b" radius={[0, 6, 6, 0]} name="Umsatz" barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom: Recent Sales + Alerts ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Recent Sales */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">Letzte Verkäufe</h3>
            <Link href="/sales" className="rounded-lg bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 transition hover:bg-zinc-200">
              Alle →
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white py-14 text-center shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
                <ShoppingBag size={20} className="text-zinc-400" />
              </div>
              <p className="text-[12px] text-zinc-400">Noch keine Verkäufe</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm divide-y divide-zinc-50">
              {recentSales.map((sale) => (
                <Link key={sale.id} href={sale.productId ? `/products/${sale.productId}` : "/sales"}
                  className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-zinc-50/80 active:bg-zinc-100">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                    <ArrowUpRight size={15} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-zinc-900">{sale.product.name}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">{sale.product.brand}{sale.customerName && ` · ${sale.customerName}`}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-bold text-zinc-900">+{formatCurrency(sale.totalAmount)}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      {new Date(sale.soldAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", timeZone: "Europe/Berlin" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900">Bestandswarnungen</h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">{alerts.length}</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm divide-y divide-zinc-50">
              {alerts.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-zinc-50/80 active:bg-zinc-100">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                    p.status === "OUT_OF_STOCK" ? "bg-red-50 group-hover:bg-red-100" : "bg-amber-50 group-hover:bg-amber-100")}>
                    {p.status === "OUT_OF_STOCK"
                      ? <XCircle size={15} className="text-red-500" />
                      : <AlertTriangle size={15} className="text-amber-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-zinc-900">{p.name}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">{p.brand}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                    p.status === "OUT_OF_STOCK" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600")}>
                    {p.quantity} Stk.
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
