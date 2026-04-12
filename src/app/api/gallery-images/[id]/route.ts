import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const image = await prisma.productImage.findUnique({ where: { id } });

    if (!image) {
      return NextResponse.json(
        { error: "Bild nicht gefunden" },
        { status: 404 }
      );
    }

    await prisma.productImage.delete({ where: { id } });

    if (image.isPrimary) {
      const nextPrimary = await prisma.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { createdAt: "asc" },
      });

      if (nextPrimary) {
        await prisma.productImage.update({
          where: { id: nextPrimary.id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { isPrimary } = body as { isPrimary?: boolean };

  try {
    const image = await prisma.productImage.findUnique({ where: { id } });

    if (!image) {
      return NextResponse.json(
        { error: "Bild nicht gefunden" },
        { status: 404 }
      );
    }

    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId: image.productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.productImage.update({
      where: { id },
      data: { ...(isPrimary !== undefined && { isPrimary }) },
    });

    if (isPrimary) {
      await prisma.product.update({
        where: { id: image.productId },
        data: { mainImage: image.imageUrl },
      });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Aktualisierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
