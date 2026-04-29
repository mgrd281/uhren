import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/services";

const emptyDashboard = {
  kpis: {
    totalProducts: 0,
    totalStock: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    inventoryValueCost: 0,
    expectedSalesValue: 0,
    totalRevenue: 0,
    totalProfit: 0,
    revenueLast30Days: 0,
    revenueLast60Days: 0,
  },
  charts: { salesOverTime: [], topProducts: [], topBrands: [], inventoryByBrand: [] },
  recentSales: [],
  alerts: [],
};

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(emptyDashboard);
  }
}
