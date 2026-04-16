import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format") || "json";

  try {
    const [products, sales, inventoryMovements, settings] = await Promise.all([
      prisma.product.findMany({
        include: { galleryImages: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sale.findMany({ orderBy: { soldAt: "desc" } }),
      prisma.inventoryMovement.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.storeSettings.findFirst(),
    ]);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");

    if (format === "csv") {
      // Products CSV
      const prodHeaders = [
        "ID", "Name", "Marke", "Modell", "SKU", "Kategorie", "Farbe",
        "Einkaufspreis", "Verkaufspreis", "Bestand", "Status", "eBay-Status",
        "Erstellt", "Notizen",
      ];
      const prodRows = products.map((p) => [
        p.id, esc(p.name), esc(p.brand), esc(p.model), p.sku, esc(p.category),
        esc(p.color), p.costPrice, p.salePriceExpected, p.quantity, p.status,
        esc(p.ebayStatus), p.createdAt.toISOString(), esc(p.notes || ""),
      ]);

      // Sales CSV
      const saleHeaders = [
        "ID", "ProduktID", "Menge", "Einzelpreis", "Gesamtbetrag",
        "Kunde", "Rechnungsnr", "Zahlung", "Plattform", "Verkauft am", "Notizen",
      ];
      const saleRows = sales.map((s) => [
        s.id, s.productId, s.quantitySold, s.salePrice, s.totalAmount,
        esc(s.customerName || ""), esc(s.invoiceNumber || ""),
        esc(s.paymentMethod || ""), esc(s.marketplace || ""),
        s.soldAt.toISOString(), esc(s.notes || ""),
      ]);

      const csv = [
        "### PRODUKTE ###",
        prodHeaders.join(";"),
        ...prodRows.map((r) => r.join(";")),
        "",
        "### VERKÄUFE ###",
        saleHeaders.join(";"),
        ...saleRows.map((r) => r.join(";")),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="uhren-backup-${timestamp}.csv"`,
        },
      });
    }

    // JSON backup (full)
    const backup = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      counts: {
        products: products.length,
        sales: sales.length,
        inventoryMovements: inventoryMovements.length,
      },
      products,
      sales,
      inventoryMovements,
      settings: settings
        ? { storeName: settings.storeName, locale: settings.locale, currencyCode: settings.currencyCode }
        : null,
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="uhren-backup-${timestamp}.json"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backup fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function esc(val: string): string {
  if (val.includes(";") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
