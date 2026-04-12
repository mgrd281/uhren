import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { productId, imageUrls } = body as {
    productId: string;
    imageUrls: string[];
  };

  if (!productId || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return NextResponse.json(
      { error: "productId und imageUrls sind erforderlich" },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { galleryImages: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produkt nicht gefunden" },
        { status: 404 }
      );
    }

    const hasPrimary = product.galleryImages.some((img) => img.isPrimary);

    const images = await Promise.all(
      imageUrls.map((url, i) =>
        prisma.productImage.create({
          data: {
            productId,
            imageUrl: url,
            isPrimary: !hasPrimary && i === 0,
          },
        })
      )
    );

    if (!product.mainImage && imageUrls.length > 0) {
      await prisma.product.update({
        where: { id: productId },
        data: { mainImage: imageUrls[0] },
      });
    }

    return NextResponse.json({ imported: images.length, images }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
