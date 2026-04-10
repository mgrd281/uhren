import { PrismaClient, StockStatus, MovementType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const statusFromQty = (quantity: number, threshold = 2): StockStatus => {
  if (quantity <= 0) return StockStatus.OUT_OF_STOCK;
  if (quantity <= threshold) return StockStatus.LOW_STOCK;
  return StockStatus.IN_STOCK;
};

async function main() {
  await prisma.inventoryMovement.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();

  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "دار الساعات الفاخرة",
      locale: "ar",
      currencyCode: "AED",
      rtlEnabled: true,
    },
  });

  const products = [
    {
      name: "Rolex Submariner Date",
      brand: "Rolex",
      model: "126610LN",
      sku: "RLX-SUB-126610LN",
      category: "Dive",
      color: "Black",
      description: "Stainless steel icon with Cerachrom bezel and timeless profile.",
      costPrice: 36000,
      salePriceExpected: 44900,
      quantity: 3,
      notes: "Top conversion performer in premium segment.",
      mainImage:
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Patek Philippe Nautilus",
      brand: "Patek Philippe",
      model: "5711/1A",
      sku: "PP-NAU-5711",
      category: "Sport Luxury",
      color: "Blue",
      description: "Highly collectible steel sport watch with integrated bracelet.",
      costPrice: 285000,
      salePriceExpected: 329000,
      quantity: 1,
      notes: "Client waitlist item.",
      mainImage:
        "https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Audemars Piguet Royal Oak",
      brand: "Audemars Piguet",
      model: "15500ST",
      sku: "AP-RO-15500",
      category: "Icon",
      color: "Grey",
      description: "Octagonal heritage with contemporary 41mm presence.",
      costPrice: 147000,
      salePriceExpected: 176500,
      quantity: 0,
      notes: "Reorder from trusted collector channel.",
      mainImage:
        "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1200&q=80",
      gallery: [],
    },
  ];

  for (const item of products) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        brand: item.brand,
        model: item.model,
        sku: item.sku,
        category: item.category,
        color: item.color,
        description: item.description,
        costPrice: item.costPrice,
        salePriceExpected: item.salePriceExpected,
        quantity: item.quantity,
        lowStockThreshold: 2,
        status: statusFromQty(item.quantity, 2),
        mainImage: item.mainImage,
        notes: item.notes,
      },
    });

    if (item.gallery.length > 0) {
      await prisma.productImage.createMany({
        data: item.gallery.map((imageUrl) => ({
          productId: product.id,
          imageUrl,
          isPrimary: false,
        })),
      });
    }

    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        type: MovementType.ADD,
        quantity: item.quantity,
        note: "Initial stock seeded",
      },
    });
  }

  const submariner = await prisma.product.findUnique({
    where: { sku: "RLX-SUB-126610LN" },
  });

  if (submariner) {
    const quantitySold = 1;
    const salePrice = 46250;

    const sale = await prisma.sale.create({
      data: {
        productId: submariner.id,
        quantitySold,
        salePrice,
        totalAmount: quantitySold * salePrice,
        customerName: "عميل خاص",
        invoiceNumber: "INV-2026-0042",
        notes: "Concierge delivery",
      },
    });

    const nextQty = submariner.quantity - quantitySold;
    await prisma.product.update({
      where: { id: submariner.id },
      data: {
        quantity: nextQty,
        status: statusFromQty(nextQty, submariner.lowStockThreshold),
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        productId: submariner.id,
        type: MovementType.SALE,
        quantity: quantitySold,
        referenceId: sale.id,
        note: "Seed sale",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
