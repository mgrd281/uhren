import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createProduct } from "@/lib/services";
import { productSchema } from "@/lib/validations";
import { getUserRole, canEdit } from "@/lib/permissions";

const FORBIDDEN = NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });

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
  const role = await getUserRole();
  if (!canEdit(role)) return FORBIDDEN;
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

/* ── Bulk Update ── */
const bulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Mindestens ein Produkt auswählen"),
  updates: z.object({
    salePriceExpected: z.coerce.number().min(0).optional(),
    costPrice: z.coerce.number().min(0).optional(),
    quantity: z.coerce.number().int().min(0).optional(),
    ebayStatus: z.string().optional(),
    category: z.string().optional(),
  }).refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "Mindestens ein Feld zum Aktualisieren angeben",
  }),
});

export async function PATCH(request: NextRequest) {
  const role = await getUserRole();
  if (!canEdit(role)) return FORBIDDEN;
  const body = await request.json();
  const parsed = bulkUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ids, updates } = parsed.data;
  const data: Record<string, unknown> = {};
  if (updates.salePriceExpected !== undefined) data.salePriceExpected = updates.salePriceExpected;
  if (updates.costPrice !== undefined) data.costPrice = updates.costPrice;
  if (updates.quantity !== undefined) data.quantity = updates.quantity;
  if (updates.ebayStatus !== undefined) data.ebayStatus = updates.ebayStatus;
  if (updates.category !== undefined) data.category = updates.category;

  // Recompute stock status if quantity changed
  if (updates.quantity !== undefined) {
    const qty = updates.quantity;
    data.status = qty === 0 ? "OUT_OF_STOCK" : qty <= 2 ? "LOW_STOCK" : "IN_STOCK";
  }

  try {
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data,
    });
    return NextResponse.json({ updated: result.count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Serverfehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
