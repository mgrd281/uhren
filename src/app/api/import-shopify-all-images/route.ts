import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE || "";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || "";

interface ShopifyImage {
  id: number;
  src: string;
  alt?: string;
  position: number;
}

interface ShopifyVariant {
  sku: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  vendor: string;
  handle: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ImportResult {
  sku: string;
  name: string;
  brand: string;
  imported: number;
  skipped: boolean;
  reason?: string;
}

export async function POST() {
  if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "SHOPIFY_STORE und SHOPIFY_ACCESS_TOKEN müssen konfiguriert sein" },
      { status: 500 }
    );
  }

  try {
    // Fetch all products from Shopify (paginate through all pages)
    const allShopifyProducts: ShopifyProduct[] = [];
    let url: string | null = `https://${SHOPIFY_STORE}/admin/api/2024-10/products.json?limit=250`;

    while (url) {
      const res: Response = await fetch(url, {
        headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Shopify API Fehler: ${res.status}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      allShopifyProducts.push(...(data.products || []));

      // Check for next page via Link header
      const linkHeader: string | null = res.headers.get("Link");
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        url = match ? match[1] : null;
      } else {
        url = null;
      }
    }

    if (allShopifyProducts.length === 0) {
      return NextResponse.json({
        totalImported: 0,
        totalShopifyProducts: 0,
        results: [],
        message: "Keine Produkte im Shopify Store gefunden",
      });
    }

    // Fetch all local products with their gallery images
    const dbProducts = await prisma.product.findMany({
      include: { galleryImages: true },
    });

    const results: ImportResult[] = [];
    let totalImported = 0;

    for (const sp of allShopifyProducts) {
      const sku = sp.variants?.[0]?.sku || "";

      // Try to find matching local product
      const dbProduct = dbProducts.find((dp) => {
        // Match by SKU (exact or with dashes removed)
        if (sku && (dp.sku === sku || dp.sku === sku.replace(/-/g, ""))) {
          return true;
        }
        // Match by model number
        if (dp.model && sku && dp.model.toUpperCase() === sku.toUpperCase()) {
          return true;
        }
        // Match by Shopify title containing product model
        if (dp.model && sp.title.toUpperCase().includes(dp.model.toUpperCase())) {
          return true;
        }
        // Match by product name contained in Shopify title
        if (dp.name && sp.title.toUpperCase().includes(dp.name.toUpperCase())) {
          return true;
        }
        return false;
      });

      if (!dbProduct) {
        results.push({
          sku,
          name: sp.title,
          brand: sp.vendor || "Unbekannt",
          imported: 0,
          skipped: true,
          reason: "Kein passendes Produkt in der Datenbank",
        });
        continue;
      }

      // Skip if Shopify product has no images
      if (!sp.images || sp.images.length === 0) {
        results.push({
          sku,
          name: dbProduct.name,
          brand: dbProduct.brand,
          imported: 0,
          skipped: true,
          reason: "Keine Bilder im Shopify Produkt",
        });
        continue;
      }

      // Transform image URLs - use Shopify CDN URL directly
      const shopifyImages = sp.images
        .sort((a, b) => a.position - b.position)
        .map((img) => {
          // Clean up Shopify CDN URL
          let imageUrl = img.src;
          if (imageUrl.includes("cdn.shopify.com")) {
            // Remove existing transform params and use clean URL
            const baseUrl = imageUrl.split("?")[0];
            imageUrl = `${baseUrl}?v=1`;
          }
          return imageUrl;
        });

      // Delete existing gallery images for this product (replace mode)
      await prisma.productImage.deleteMany({
        where: { productId: dbProduct.id },
      });

      // Create new gallery images from Shopify
      for (let i = 0; i < shopifyImages.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: dbProduct.id,
            imageUrl: shopifyImages[i],
            isPrimary: i === 0,
          },
        });
      }

      // Update mainImage on the product
      await prisma.product.update({
        where: { id: dbProduct.id },
        data: { mainImage: shopifyImages[0] },
      });

      totalImported += shopifyImages.length;

      results.push({
        sku,
        name: dbProduct.name,
        brand: dbProduct.brand,
        imported: shopifyImages.length,
        skipped: false,
      });
    }

    return NextResponse.json({
      totalImported,
      totalShopifyProducts: allShopifyProducts.length,
      totalDbProducts: dbProducts.length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import fehlgeschlagen";
    console.error("Shopify import error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}