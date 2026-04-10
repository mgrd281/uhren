import { NextRequest, NextResponse } from "next/server";
import { getReportsData } from "@/lib/services";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const brand = searchParams.get("brand") ?? undefined;

  const data = await getReportsData({ startDate, endDate, brand });
  return NextResponse.json(data);
}
