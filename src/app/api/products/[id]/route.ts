import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/lib/services";
import { productSchema } from "@/lib/validations";
import { getUserRole, canEdit, canDelete } from "@/lib/permissions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        galleryImages: true,
        sales: { orderBy: { soldAt: "desc" } },
        inventoryMoves: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produkt nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Datenbankverbindungsfehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getUserRole();
  if (!canEdit(role)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const parsed = productSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const product = await updateProduct(id, parsed.data);
    return NextResponse.json(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Serverfehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getUserRole();
  if (!canDelete(role)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.inventoryMovement.deleteMany({ where: { productId: id } });
    await prisma.sale.deleteMany({ where: { productId: id } });
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  }
}
