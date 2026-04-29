import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(images);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { imageUrl } = await request.json() as { imageUrl: string };

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl fehlt" }, { status: 400 });
  }

  const count = await prisma.productImage.count({ where: { productId: id } });
  const image = await prisma.productImage.create({
    data: { productId: id, imageUrl, isPrimary: count === 0 },
  });
  return NextResponse.json(image, { status: 201 });
}

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
