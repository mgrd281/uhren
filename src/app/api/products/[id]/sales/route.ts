import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sales = await prisma.sale.findMany({
    where: { productId: id },
    orderBy: { soldAt: "desc" },
  });
  return NextResponse.json(sales);
}
