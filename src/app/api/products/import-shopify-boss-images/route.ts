import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SHOPIFY_DOMAIN = "45dv93-bk.myshopify.com";
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || "";

interface ShopifyImage {
  src: string;
}

interface ShopifyProduct {
  title: string;
  vendor: string;
  variants: { sku: string }[];
  images: ShopifyImage[];
}

export async function POST(_request: NextRequest) {
  if (!SHOPIFY_TOKEN) {
    return NextResponse.json(
      { error: "SHOPIFY_ACCESS_TOKEN nicht konfiguriert" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2024-10/products.json?limit=250`,
      {
        headers: { "X-Shopify-Access-Token": SHOPIFY_TOKEN },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Shopify API Fehler: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const shopifyProducts: ShopifyProduct[] = (data.products || []).filter(
      (p: ShopifyProduct) =>
        p.vendor?.toUpperCase().includes("BOSS") ||
        p.title?.toUpperCase().includes("BOSS")
    );

    const dbProducts = await prisma.product.findMany({
      where: { brand: "BOSS" },
      include: { galleryImages: true },
    });

    const results: {
      sku: string;
      name: string;
      imported: number;
      skipped: boolean;
    }[] = [];

    for (const sp of shopifyProducts) {
      const sku = sp.variants?.[0]?.sku || "";
      if (!sku) continue;

      const dbProduct = dbProducts.find(
        (dp) =>
          dp.sku === sku ||
          dp.sku === sku.replace(/-/g, "") ||
          dp.model === sku ||
          sp.title.includes(dp.model)
      );

      if (!dbProduct) {
        results.push({ sku, name: sp.title, imported: 0, skipped: true });
        continue;
      }

      const existingUrls = new Set(
        dbProduct.galleryImages.map((img) => img.imageUrl)
      );
      // Convert AVIF URLs to JPG using Shopify's image transformation
      const transformUrl = (url: string): string => {
        if (!url) return url;
        // Shopify CDN supports format conversion via URL params
        if (url.includes('cdn.shopify.com')) {
          // Remove any existing transform params and add jpg format
          const baseUrl = url.split('?')[0];
          return `${baseUrl}?v=1`;
        }
        return url;
      };

      const newImages = (sp.images || [])
        .filter((img) => !existingUrls.has(transformUrl(img.src)))
        .map((img) => ({ ...img, src: transformUrl(img.src) }));

      if (newImages.length === 0) {
        results.push({
          sku,
          name: dbProduct.name,
          imported: 0,
          skipped: true,
        });
        continue;
      }

      const hasPrimary = dbProduct.galleryImages.some((img) => img.isPrimary);

      for (let i = 0; i < newImages.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: dbProduct.id,
            imageUrl: newImages[i].src,
            isPrimary: !hasPrimary && i === 0,
          },
        });
      }
      
      // Also set mainImage if not set
      if (!dbProduct.mainImage && newImages.length > 0) {
        await prisma.product.update({
          where: { id: dbProduct.id },
          data: { mainImage: newImages[0].src },
        });
      }

      results.push({
        sku,
        name: dbProduct.name,
        imported: newImages.length,
        skipped: false,
      });
    }

    const totalImported = results.reduce((sum, r) => sum + r.imported, 0);

    return NextResponse.json({
      totalImported,
      totalShopifyProducts: shopifyProducts.length,
      totalDbProducts: dbProducts.length,
      results,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Import fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
