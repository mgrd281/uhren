"use client";

import { useEffect, useState } from "react";
import { Card, KpiCard, Badge, PageHeader, Skeleton } from "@/components/ui";
import { formatCurrency, formatNumber, formatDateTime, stockStatusLabel, stockStatusColor } from "@/lib/utils";
import {
  Package,
  Warehouse,
  AlertTriangle,
  XCircle,
  DollarSign,
  TrendingUp,
  Receipt,
  Gem,
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
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} className="h-24" />))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { kpis, charts, recentSales, alerts } = data;

  return (
    <div className="space-y-10">
      <PageHeader title="Dashboard" description="Übersicht über Shop-Leistung und Bestand" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Produkte gesamt" value={formatNumber(kpis.totalProducts)} icon={<Package size={20} />} accent="bg-zinc-100 text-zinc-700" />
        <KpiCard label="Gesamtbestand" value={formatNumber(kpis.totalStock)} sub="Stück" icon={<Warehouse size={20} />} accent="bg-blue-50 text-blue-600" />
        <KpiCard label="Niedriger Bestand" value={formatNumber(kpis.lowStockItems)} icon={<AlertTriangle size={20} />} accent="bg-amber-50 text-amber-600" />
        <KpiCard label="Ausverkauft" value={formatNumber(kpis.outOfStockItems)} icon={<XCircle size={20} />} accent="bg-red-50 text-red-600" />
        <KpiCard label="Bestandswert (EK)" value={formatCurrency(kpis.inventoryValueCost)} icon={<DollarSign size={20} />} accent="bg-zinc-100 text-zinc-700" />
        <KpiCard label="Erwarteter VK-Wert" value={formatCurrency(kpis.expectedSalesValue)} icon={<TrendingUp size={20} />} accent="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Gesamtumsatz" value={formatCurrency(kpis.totalRevenue)} icon={<Receipt size={20} />} accent="bg-blue-50 text-blue-600" />
        <KpiCard label="Gesamtgewinn" value={formatCurrency(kpis.totalProfit)} icon={<Gem size={20} />} accent="bg-gold-50 text-gold-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-6 text-sm font-semibold text-zinc-700">Verkäufe im Zeitverlauf</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.salesOverTime}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18181b" stopOpacity={0.15} /><stop offset="100%" stopColor="#18181b" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f4f4f5", fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#18181b" strokeWidth={2} fill="url(#gRev)" name="Umsatz" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#gProfit)" name="Gewinn" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="mb-6 text-sm font-semibold text-zinc-700">Top Marken</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.topBrands} dataKey="revenue" nameKey="brand" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={2} label={({ name }: { name?: string }) => name ?? ""}>
                  {charts.topBrands.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f4f4f5", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-6 text-sm font-semibold text-zinc-700">Meistverkaufte Produkte</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#71717a" }} width={140} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f4f4f5", fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#18181b" radius={[0, 6, 6, 0]} name="Umsatz" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="mb-6 text-sm font-semibold text-zinc-700">Letzte Verkäufe</h3>
          {recentSales.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-zinc-400">Noch keine Verkäufe</p>
          ) : (
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 transition-colors hover:bg-zinc-50">
                  <div>
                    <p className="text-[13px] font-medium text-zinc-800">{sale.product.name}</p>
                    <p className="text-[11px] text-zinc-400">{sale.product.brand} · {sale.customerName ?? "—"} · {formatDateTime(sale.soldAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-zinc-900">{formatCurrency(sale.totalAmount)}</p>
                    <p className="text-[11px] text-zinc-400">{sale.quantitySold} Stück</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-zinc-700">⚠️ Bestandswarnungen</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 transition-all hover:shadow-md">
                <div>
                  <p className="text-[13px] font-medium text-zinc-800">{p.name}</p>
                  <p className="text-[11px] text-zinc-400">{p.brand}</p>
                </div>
                <Badge className={stockStatusColor(p.status)}>{stockStatusLabel(p.status)}</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
