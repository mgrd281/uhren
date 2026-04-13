import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { galleryImages: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produkt nicht gefunden" }, { status: 404 });
    }

    const deleted = await prisma.productImage.deleteMany({ where: { productId: id } });

    await prisma.product.update({
      where: { id },
      data: { mainImage: null },
    });

    return NextResponse.json({ deleted: deleted.count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Löschen fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
