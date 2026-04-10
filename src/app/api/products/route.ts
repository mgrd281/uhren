import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProduct } from "@/lib/services";
import { productSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const brand = searchParams.get("brand");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (brand) where.brand = brand;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        _count: { select: { sales: true } },
        sales: { select: { totalAmount: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = products.map((p) => {
      const totalRevenue = p.sales.reduce((s, sale) => s + sale.totalAmount, 0);
      const { sales, ...rest } = p;
      return { ...rest, totalRevenue };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const product = await createProduct(parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Serverfehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
