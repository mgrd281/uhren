import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE || "45dv93-bk.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

interface ShopifyImage {
  id: string;
  src: string;
  altText?: string;
}

interface ShopifyProduct {
  id: string;
  title: string;
  images: ShopifyImage[];
}

async function fetchShopifyProducts(query: string): Promise<ShopifyProduct[]> {
  const graphqlQuery = `
    {
      products(first: 250, query: "${query}") {
        edges {
          node {
            id
            title
            images(first: 10) {
              edges {
                node {
                  id
                  src
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN || "",
    },
    body: JSON.stringify({ query: graphqlQuery }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data.products.edges.map((edge: any) => ({
    id: edge.node.id,
    title: edge.node.title,
    images: edge.node.images.edges.map((imgEdge: any) => ({
      id: imgEdge.node.id,
      src: imgEdge.node.src,
      altText: imgEdge.node.altText,
    })),
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, productName } = body as { brand?: string; productName?: string };

    if (!brand && !productName) {
      return NextResponse.json(
        { error: "brand or productName is required" },
        { status: 400 }
      );
    }

    // Build search query
    const searchQuery = productName || brand || "";

    // Fetch products from Shopify
    const shopifyProducts = await fetchShopifyProducts(searchQuery);

    if (shopifyProducts.length === 0) {
      return NextResponse.json({
        message: "No products found on Shopify",
        imported: 0,
      });
    }

    let totalImported = 0;

    // For each Shopify product, find matching local product and import images
    for (const shopProduct of shopifyProducts) {
      // Try to find matching product by name
      const localProduct = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: shopProduct.title, mode: "insensitive" } },
            { sku: { contains: shopProduct.title, mode: "insensitive" } },
          ],
        },
        include: { galleryImages: true },
      });

      if (!localProduct) continue;

      // Check which images already exist
      const existingUrls = new Set(
        localProduct.galleryImages.map((img) => img.imageUrl)
      );

      // Import new images
      const hasPrimary = localProduct.galleryImages.some((img) => img.isPrimary);
      let primarySet = hasPrimary;

      for (const shopImage of shopProduct.images) {
        if (existingUrls.has(shopImage.src)) continue;

        await prisma.productImage.create({
          data: {
            productId: localProduct.id,
            imageUrl: shopImage.src,
            isPrimary: !primarySet,
          },
        });

        if (!primarySet) {
          primarySet = true;
          if (!localProduct.mainImage) {
            await prisma.product.update({
              where: { id: localProduct.id },
              data: { mainImage: shopImage.src },
            });
          }
        }

        totalImported++;
      }
    }

    return NextResponse.json({
      message: "Import completed",
      imported: totalImported,
      productsMatched: shopifyProducts.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    console.error("Import error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
