import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSale } from "@/lib/services";
import { saleSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const sales = await prisma.sale.findMany({
      include: { product: true },
      orderBy: { soldAt: "desc" },
      take: limit,
    });

    return NextResponse.json(sales);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = saleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const sale = await createSale(parsed.data);
    return NextResponse.json(sale, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Serverfehler";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
