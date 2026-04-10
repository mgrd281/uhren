import { NextRequest, NextResponse } from "next/server";
import { getReportsData } from "@/lib/services";

const emptyReports = {
  revenue: 0,
  profit: 0,
  salesCount: 0,
  topProducts: [],
  slowMovers: [],
  brands: [],
  sales: [],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const brand = searchParams.get("brand") ?? undefined;

    const data = await getReportsData({ startDate, endDate, brand });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(emptyReports);
  }
}
