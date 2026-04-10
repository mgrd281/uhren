"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Input, Select, Skeleton } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ReportData {
  revenue: number;
  profit: number;
  salesCount: number;
  topProducts: {
    name: string;
    brand: string;
    totalSold: number;
    revenue: number;
    profit: number;
  }[];
  slowMovers: {
    name: string;
    brand: string;
    totalSold: number;
    quantity: number;
  }[];
  brands: string[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [brand, setBrand] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (brand) params.set("brand", brand);

    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d && d.topProducts) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [startDate, endDate, brand]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Berichte"
        description="Verkaufs- und Produktanalyse"
      />

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Von Datum"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Bis Datum"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Select
            label="Marke"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            <option value="">Alle</option>
            {data?.brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : data ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="text-center">
              <p className="text-[12px] text-zinc-400">Gesamtumsatz</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">
                {formatCurrency(data.revenue)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                {formatNumber(data.salesCount)} Verkäufe
              </p>
            </Card>
            <Card className="text-center">
              <p className="text-[12px] text-zinc-400">Gesamtgewinn</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatCurrency(data.profit)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                Gewinnmarge:{" "}
                {data.revenue > 0
                  ? ((data.profit / data.revenue) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </Card>
            <Card className="text-center">
              <p className="text-[12px] text-zinc-400">Durchschn. Verkaufswert</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">
                {data.salesCount > 0
                  ? formatCurrency(data.revenue / data.salesCount)
                  : "—"}
              </p>
            </Card>
          </div>

          {/* Top products chart */}
          {data.topProducts.length > 0 && (
            <Card>
              <h3 className="mb-6 text-sm font-semibold text-zinc-700">
                Top-Produkte
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#71717a" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #f4f4f5",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#18181b"
                      radius={[6, 6, 0, 0]}
                      name="Umsatz"
                    />
                    <Bar
                      dataKey="profit"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      name="Gewinn"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Tables */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top products table */}
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-zinc-700">
                Meistverkaufte Produkte
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[11px] text-zinc-400">
                      <th className="py-2 text-start font-medium">Produkt</th>
                      <th className="py-2 text-start font-medium">Verkäufe</th>
                      <th className="py-2 text-start font-medium">Umsatz</th>
                      <th className="py-2 text-start font-medium">Gewinn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p, i) => (
                      <tr
                        key={i}
                        className="border-b border-zinc-50 transition-colors hover:bg-zinc-50"
                      >
                        <td className="py-2.5">
                          <p className="font-medium text-zinc-800">{p.name}</p>
                          <p className="text-[11px] text-zinc-400">{p.brand}</p>
                        </td>
                        <td className="py-2.5">{p.totalSold}</td>
                        <td className="py-2.5">
                          {formatCurrency(p.revenue)}
                        </td>
                        <td className="py-2.5 text-emerald-600">
                          {formatCurrency(p.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Slow movers */}
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-zinc-700">
                Langsam verkaufte Produkte
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[11px] text-zinc-400">
                      <th className="py-2 text-start font-medium">Produkt</th>
                      <th className="py-2 text-start font-medium">Verkäufe</th>
                      <th className="py-2 text-start font-medium">Bestand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slowMovers.map((p, i) => (
                      <tr
                        key={i}
                        className="border-b border-zinc-50 transition-colors hover:bg-zinc-50"
                      >
                        <td className="py-2.5">
                          <p className="font-medium text-zinc-800">{p.name}</p>
                          <p className="text-[11px] text-zinc-400">{p.brand}</p>
                        </td>
                        <td className="py-2.5">
                          {p.totalSold === 0 ? (
                            <span className="text-red-500">Keine Verkäufe</span>
                          ) : (
                            p.totalSold
                          )}
                        </td>
                        <td className="py-2.5">{p.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
