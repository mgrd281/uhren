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
    <div className="space-y-5 lg:space-y-8">
      {/* ── Header ── */}
      <div className="lg:flex lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">
            Dashboard
          </h1>
          <p className="mt-0.5 text-[12px] text-zinc-400 lg:text-sm">
            Übersicht
          </p>
        </div>
        <p className="hidden text-sm text-zinc-400 lg:block">
          {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Revenue Summary ── */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-3 lg:gap-6">
        <Link
          href="/sales"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900 px-3.5 py-3 text-white transition-all active:scale-[0.98] lg:rounded-3xl lg:px-8 lg:py-8 lg:hover:shadow-2xl lg:hover:shadow-zinc-900/25"
        >
          <div className="absolute -right-10 -top-10 hidden h-40 w-40 rounded-full bg-white/[0.04] lg:block" />
          <div className="absolute right-8 top-20 hidden h-20 w-20 rounded-full bg-white/[0.03] lg:block" />
          <div className="absolute bottom-0 left-0 hidden h-1 w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent lg:block" />
          <div>
            <div className="flex items-center gap-2">
              <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-white/10 lg:flex">
                <Receipt size={15} className="text-zinc-300" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 lg:text-[11px]">
                Umsatz
              </span>
            </div>
            <span className="mt-1.5 block text-[16px] font-extrabold tracking-tight sm:text-lg lg:mt-4 lg:text-4xl">
              {formatCurrency(kpis.totalRevenue)}
            </span>
          </div>
          <span className="mt-1 flex items-center gap-0.5 text-[9px] text-zinc-500 lg:mt-6 lg:text-[13px] lg:group-hover:text-zinc-300">
            Alle Verkäufe <ChevronRight size={9} className="transition-transform lg:h-4 lg:w-4 lg:group-hover:translate-x-1" />
          </span>
        </Link>
        <Link
          href="/sales"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-100 bg-white px-3.5 py-3 shadow-sm transition-all active:scale-[0.98] lg:rounded-3xl lg:border-emerald-100 lg:px-8 lg:py-8 lg:hover:-translate-y-1 lg:hover:shadow-xl lg:hover:shadow-emerald-500/10"
        >
          <div className="absolute left-0 top-0 hidden h-full w-1.5 rounded-l-3xl bg-gradient-to-b from-emerald-400 to-emerald-600 lg:block" />
          <div className="absolute -right-8 -bottom-8 hidden h-32 w-32 rounded-full bg-emerald-50 lg:block" />
          <div>
            <div className="flex items-center gap-2">
              <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 lg:flex">
                <TrendingUp size={15} className="text-emerald-500" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 lg:text-[11px]">
                Gewinn
              </span>
            </div>
            <span className="mt-1.5 block text-[16px] font-extrabold tracking-tight text-emerald-600 sm:text-lg lg:mt-4 lg:text-4xl">
              {formatCurrency(kpis.totalProfit)}
            </span>
          </div>
          <div className="mt-1 hidden items-center gap-3 lg:mt-6 lg:flex">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-600">
              {kpis.totalRevenue > 0 ? `${Math.round((kpis.totalProfit / kpis.totalRevenue) * 100)}%` : "—"} Marge
            </span>
          </div>
        </Link>
        <Link
          href="/products"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-100 bg-white px-3.5 py-3 shadow-sm transition-all active:scale-[0.98] lg:rounded-3xl lg:px-8 lg:py-8 lg:hover:-translate-y-1 lg:hover:shadow-xl"
        >
          <div className="absolute left-0 top-0 hidden h-full w-1.5 rounded-l-3xl bg-gradient-to-b from-zinc-700 to-zinc-900 lg:block" />
          <div className="absolute -right-8 -bottom-8 hidden h-32 w-32 rounded-full bg-zinc-50 lg:block" />
          <div>
            <div className="flex items-center gap-2">
              <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 lg:flex">
                <Gem size={15} className="text-zinc-500" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 lg:text-[11px]">
                Bestandswert
              </span>
            </div>
            <span className="mt-1.5 block text-[16px] font-extrabold tracking-tight text-zinc-900 sm:text-lg lg:mt-4 lg:text-4xl">
              {formatCurrency(kpis.expectedSalesValue)}
            </span>
          </div>
          <div className="mt-1 hidden items-center gap-2 lg:mt-6 lg:flex">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-[12px] font-bold text-zinc-600">
              {kpis.totalStock} Artikel
            </span>
          </div>
        </Link>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        <Link
          href="/products"
          className="group flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-all active:scale-[0.98] lg:gap-4 lg:p-5 lg:hover:-translate-y-0.5 lg:hover:shadow-lg"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 transition-colors lg:h-12 lg:w-12 lg:group-hover:bg-zinc-900 lg:group-hover:text-white">
            <Package size={18} className="text-zinc-600 lg:h-5 lg:w-5 lg:group-hover:text-white" />
          </div>
          <div>
            <p className="text-[18px] font-bold tracking-tight text-zinc-900 lg:text-2xl">{formatNumber(kpis.totalProducts)}</p>
            <p className="text-[11px] text-zinc-400 lg:text-xs">Produkte</p>
          </div>
        </Link>
        <Link
          href="/products"
          className="group flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-all active:scale-[0.98] lg:gap-4 lg:p-5 lg:hover:-translate-y-0.5 lg:hover:shadow-lg"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 transition-colors lg:h-12 lg:w-12 lg:group-hover:bg-blue-600">
            <Warehouse size={18} className="text-blue-600 lg:h-5 lg:w-5 lg:group-hover:text-white" />
          </div>
          <div>
            <p className="text-[18px] font-bold tracking-tight text-zinc-900 lg:text-2xl">{formatNumber(kpis.totalStock)}</p>
            <p className="text-[11px] text-zinc-400 lg:text-xs">Auf Lager</p>
          </div>
        </Link>
        {kpis.lowStockItems > 0 && (
          <Link
            href="/products"
            className="group flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 transition-all active:scale-[0.98] lg:gap-4 lg:p-5 lg:hover:-translate-y-0.5 lg:hover:shadow-lg lg:hover:border-amber-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 transition-colors lg:h-12 lg:w-12 lg:group-hover:bg-amber-500">
              <AlertTriangle size={18} className="text-amber-600 lg:h-5 lg:w-5 lg:group-hover:text-white" />
            </div>
            <div>
              <p className="text-[18px] font-bold tracking-tight text-amber-700 lg:text-2xl">{formatNumber(kpis.lowStockItems)}</p>
              <p className="text-[11px] text-amber-600 lg:text-xs">Niedrig</p>
            </div>
          </Link>
        )}
        {kpis.outOfStockItems > 0 && (
          <Link
            href="/products"
            className="group flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-4 transition-all active:scale-[0.98] lg:gap-4 lg:p-5 lg:hover:-translate-y-0.5 lg:hover:shadow-lg lg:hover:border-red-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 transition-colors lg:h-12 lg:w-12 lg:group-hover:bg-red-500">
              <XCircle size={18} className="text-red-600 lg:h-5 lg:w-5 lg:group-hover:text-white" />
            </div>
            <div>
              <p className="text-[18px] font-bold tracking-tight text-red-700 lg:text-2xl">{formatNumber(kpis.outOfStockItems)}</p>
              <p className="text-[11px] text-red-600 lg:text-xs">Ausverkauft</p>
            </div>
          </Link>
        )}
      </div>

      {/* ── Sales Chart ── */}
      {charts.salesOverTime.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm lg:p-8">
          <div className="mb-4 flex items-center justify-between lg:mb-8">
            <div>
              <h3 className="text-[13px] font-bold text-zinc-900 lg:text-lg">Umsatzverlauf</h3>
              <p className="mt-0.5 hidden text-[12px] text-zinc-400 lg:block">Umsatz & Gewinn der letzten Monate</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-4 lg:flex">
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-900" /> Umsatz
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> Gewinn
                </span>
              </div>
              <Link href="/reports" className="text-[11px] font-medium text-zinc-400 transition-colors active:text-zinc-600 lg:text-xs lg:hover:text-zinc-600">
                Details →
              </Link>
            </div>
          </div>
          <div className="h-48 sm:h-64 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.salesOverTime}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18181b" stopOpacity={0.12} /><stop offset="100%" stopColor="#18181b" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.12} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} width={50} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f4f4f5", fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                <Area type="monotone" dataKey="revenue" stroke="#18181b" strokeWidth={2.5} fill="url(#gRev)" name="Umsatz" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fill="url(#gProfit)" name="Gewinn" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Top Brands + Top Products side by side on desktop ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        {charts.topBrands.length > 0 && (
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm lg:p-6">
            <h3 className="mb-4 text-[13px] font-bold text-zinc-900 lg:mb-6 lg:text-base">Top Marken</h3>
            <div className="h-48 lg:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.topBrands} dataKey="revenue" nameKey="brand" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={2} label={({ name }: { name?: string }) => name ?? ""} style={{ fontSize: 10 }}>
                    {charts.topBrands.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f4f4f5", fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {charts.topProducts.length > 0 && (
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm lg:p-6">
            <h3 className="mb-4 text-[13px] font-bold text-zinc-900 lg:mb-6 lg:text-base">Meistverkauft</h3>
            <div className="h-48 lg:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#71717a" }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f4f4f5", fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="revenue" fill="#18181b" radius={[0, 6, 6, 0]} name="Umsatz" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Sales + Alerts side by side on desktop ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        {/* Recent Sales */}
        <div>
          <div className="mb-3 flex items-center justify-between lg:mb-4">
            <h3 className="text-[13px] font-bold text-zinc-900 lg:text-base">Letzte Verkäufe</h3>
            <Link href="/sales" className="text-[11px] font-medium text-zinc-400 transition-colors active:text-zinc-600 lg:text-xs lg:hover:text-zinc-600">
              Alle ansehen →
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-zinc-100 bg-white py-12 text-center shadow-sm lg:py-16">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 lg:h-14 lg:w-14">
                <ShoppingBag size={20} className="text-zinc-400 lg:h-6 lg:w-6" />
              </div>
              <p className="text-[12px] text-zinc-400 lg:text-sm">Noch keine Verkäufe</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-100 bg-white divide-y divide-zinc-100 overflow-hidden shadow-sm">
              {recentSales.map((sale) => (
                <Link
                  key={sale.id}
                  href={sale.productId ? `/products/${sale.productId}` : "/sales"}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-zinc-50 lg:gap-4 lg:px-5 lg:py-4 lg:hover:bg-zinc-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 transition-colors lg:h-11 lg:w-11 lg:group-hover:bg-emerald-100">
                    <ArrowUpRight size={18} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-zinc-900 lg:text-sm">
                      {sale.product.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-400 lg:text-xs">
                      {sale.product.brand}
                      {sale.customerName && ` · ${sale.customerName}`}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-[11px] text-zinc-400 lg:block">
                    {new Date(sale.soldAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-bold text-zinc-900 lg:text-[15px]">
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

        {/* Alerts */}
        {alerts.length > 0 && (
          <div>
            <h3 className="mb-3 text-[13px] font-bold text-zinc-900 lg:mb-4 lg:text-base">⚠️ Bestandswarnungen</h3>
            <div className="rounded-2xl border border-zinc-100 bg-white divide-y divide-zinc-100 overflow-hidden shadow-sm">
              {alerts.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-zinc-50 lg:gap-4 lg:px-5 lg:py-4 lg:hover:bg-zinc-50"
                >
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors lg:h-11 lg:w-11",
                    p.status === "OUT_OF_STOCK" ? "bg-red-50 lg:group-hover:bg-red-100" : "bg-amber-50 lg:group-hover:bg-amber-100"
                  )}>
                    {p.status === "OUT_OF_STOCK"
                      ? <XCircle size={18} className="text-red-500" />
                      : <AlertTriangle size={18} className="text-amber-500" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-zinc-900 lg:text-sm">{p.name}</p>
                    <p className="text-[11px] text-zinc-400 lg:text-xs">{p.brand}</p>
                  </div>
                  <div className="shrink-0">
                    <span className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold lg:text-[11px]",
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
    </div>
  );
}
