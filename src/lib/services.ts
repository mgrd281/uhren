import { prisma } from "@/lib/prisma";
import { StockStatus, MovementType } from "@prisma/client";

function statusFromQty(quantity: number, threshold: number): StockStatus {
  if (quantity <= 0) return StockStatus.OUT_OF_STOCK;
  if (quantity <= threshold) return StockStatus.LOW_STOCK;
  return StockStatus.IN_STOCK;
}

export async function createProduct(data: {
  name: string;
  brand: string;
  model: string;
  sku: string;
  category: string;
  color: string;
  description: string;
  costPrice: number;
  salePriceExpected: number;
  quantity: number;
  lowStockThreshold?: number;
  mainImage?: string | null;
  notes?: string | null;
}) {
  const threshold = data.lowStockThreshold ?? 2;
  const product = await prisma.product.create({
    data: {
      ...data,
      lowStockThreshold: threshold,
      status: statusFromQty(data.quantity, threshold),
    },
  });

  if (data.quantity > 0) {
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        type: MovementType.ADD,
        quantity: data.quantity,
        note: "Anfangsbestand",
      },
    });
  }

  return product;
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    brand: string;
    model: string;
    sku: string;
    category: string;
    color: string;
    description: string;
    costPrice: number;
    salePriceExpected: number;
    quantity: number;
    lowStockThreshold: number;
    mainImage: string | null;
    notes: string | null;
  }>
) {
  const current = await prisma.product.findUniqueOrThrow({ where: { id } });
  const threshold = data.lowStockThreshold ?? current.lowStockThreshold;
  const qty = data.quantity ?? current.quantity;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      status: statusFromQty(qty, threshold),
    },
  });

  if (data.quantity !== undefined && data.quantity !== current.quantity) {
    const diff = data.quantity - current.quantity;
    await prisma.inventoryMovement.create({
      data: {
        productId: id,
        type: diff > 0 ? MovementType.ADD : MovementType.ADJUSTMENT,
        quantity: Math.abs(diff),
        note: diff > 0 ? "Manuelle Bestandserhöhung" : "Manuelle Bestandsanpassung",
      },
    });
  }

  return product;
}

export async function createSale(data: {
  productId: string;
  quantitySold: number;
  salePrice: number;
  customerName?: string | null;
  invoiceNumber?: string | null;
  paymentMethod?: string | null;
  marketplace?: string | null;
  shippingCost?: number;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  packagingCost?: number;
  shippingAddress?: string | null;
  soldAt?: Date;
  notes?: string | null;
}) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: data.productId },
  });

  if (product.quantity < data.quantitySold) {
    throw new Error(
      `Verfügbare Menge (${product.quantity}) ist geringer als angeforderte Menge (${data.quantitySold})`
    );
  }

  const totalAmount = data.quantitySold * data.salePrice - (data.shippingCost ?? 0) - (data.packagingCost ?? 0);

  const sale = await prisma.sale.create({
    data: {
      productId: data.productId,
      quantitySold: data.quantitySold,
      salePrice: data.salePrice,
      totalAmount,
      customerName: data.customerName,
      invoiceNumber: data.invoiceNumber,
      paymentMethod: data.paymentMethod,
      marketplace: data.marketplace,
      shippingCost: data.shippingCost ?? 0,
      shippingCarrier: data.shippingCarrier ?? null,
      trackingNumber: data.trackingNumber ?? null,
      packagingCost: data.packagingCost ?? 0,
      shippingAddress: data.shippingAddress ?? null,
      soldAt: data.soldAt ?? new Date(),
      notes: data.notes,
    },
  });

  const newQty = product.quantity - data.quantitySold;
  await prisma.product.update({
    where: { id: data.productId },
    data: {
      quantity: newQty,
      status: statusFromQty(newQty, product.lowStockThreshold),
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      productId: data.productId,
      type: MovementType.SALE,
      quantity: data.quantitySold,
      referenceId: sale.id,
      note: `Verkauf - Rechnung ${data.invoiceNumber ?? "ohne Nummer"}`,
    },
  });

  return sale;
}

export async function deleteSale(saleId: string) {
  const sale = await prisma.sale.findUniqueOrThrow({
    where: { id: saleId },
    include: { product: true },
  });

  // Restore product quantity
  const newQty = sale.product.quantity + sale.quantitySold;
  await prisma.product.update({
    where: { id: sale.productId },
    data: {
      quantity: newQty,
      status: statusFromQty(newQty, sale.product.lowStockThreshold),
    },
  });

  // Remove linked inventory movement
  await prisma.inventoryMovement.deleteMany({
    where: { referenceId: saleId },
  });

  // Delete the sale
  await prisma.sale.delete({ where: { id: saleId } });

  return sale;
}

export async function getDashboardData() {
  const [products, sales, lowStockProducts] = await Promise.all([
    prisma.product.findMany(),
    prisma.sale.findMany({ include: { product: true } }),
    prisma.product.findMany({
      where: { status: { in: [StockStatus.LOW_STOCK, StockStatus.OUT_OF_STOCK] } },
      orderBy: { quantity: "asc" },
      take: 10,
    }),
  ]);

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockItems = products.filter((p) => p.status === StockStatus.LOW_STOCK).length;
  const outOfStockItems = products.filter((p) => p.status === StockStatus.OUT_OF_STOCK).length;
  const inventoryValueCost = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);
  const expectedSalesValue = products.reduce(
    (sum, p) => sum + p.salePriceExpected * p.quantity,
    0
  );
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = sales.reduce(
    (sum, s) => sum + (s.salePrice - s.product.costPrice) * s.quantitySold,
    0
  );

  // Revenue last 30 / 60 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const revenueLast30Days = sales
    .filter((s) => new Date(s.soldAt) >= thirtyDaysAgo)
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const revenueLast60Days = sales
    .filter((s) => new Date(s.soldAt) >= sixtyDaysAgo)
    .reduce((sum, s) => sum + s.totalAmount, 0);

  // Sales over time (last 12 months)
  const salesOverTime: { month: string; revenue: number; profit: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthSales = sales.filter((s) => {
      const sd = new Date(s.soldAt);
      return sd >= d && sd <= monthEnd;
    });
    const revenue = monthSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const profit = monthSales.reduce(
      (sum, s) => sum + (s.salePrice - s.product.costPrice) * s.quantitySold,
      0
    );
    salesOverTime.push({
      month: d.toLocaleDateString("de-DE", { month: "short", year: "numeric" }),
      revenue,
      profit,
    });
  }

  // Top selling products
  const productSalesMap = new Map<string, { name: string; totalSold: number; revenue: number }>();
  for (const s of sales) {
    const existing = productSalesMap.get(s.productId);
    if (existing) {
      existing.totalSold += s.quantitySold;
      existing.revenue += s.totalAmount;
    } else {
      productSalesMap.set(s.productId, {
        name: s.product.name,
        totalSold: s.quantitySold,
        revenue: s.totalAmount,
      });
    }
  }
  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top brands
  const brandMap = new Map<string, number>();
  for (const s of sales) {
    brandMap.set(s.product.brand, (brandMap.get(s.product.brand) ?? 0) + s.totalAmount);
  }
  const topBrands = Array.from(brandMap.entries())
    .map(([brand, revenue]) => ({ brand, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top brands by inventory value with stock + sold + profit info
  const invBrandMap = new Map<string, { value: number; stock: number; sold: number; profit: number }>();
  for (const p of products) {
    const existing = invBrandMap.get(p.brand) ?? { value: 0, stock: 0, sold: 0, profit: 0 };
    invBrandMap.set(p.brand, {
      value: existing.value + p.salePriceExpected * p.quantity,
      stock: existing.stock + p.quantity,
      sold: existing.sold,
      profit: existing.profit,
    });
  }
  for (const s of sales) {
    const existing = invBrandMap.get(s.product.brand);
    if (existing) {
      existing.sold += s.quantitySold;
      existing.profit += (s.salePrice - s.product.costPrice) * s.quantitySold;
    }
  }
  const inventoryByBrand = Array.from(invBrandMap.entries())
    .map(([brand, d]) => ({ brand, value: d.value, stock: d.stock, sold: d.sold, profit: d.profit }))
    .sort((a, b) => b.value - a.value);

  // Recent sales
  const recentSales = await prisma.sale.findMany({
    include: { product: true },
    orderBy: { soldAt: "desc" },
    take: 5,
  });

  return {
    kpis: {
      totalProducts,
      totalStock,
      lowStockItems,
      outOfStockItems,
      inventoryValueCost,
      expectedSalesValue,
      totalRevenue,
      totalProfit,
      revenueLast30Days,
      revenueLast60Days,
    },
    charts: {
      salesOverTime,
      topProducts,
      topBrands,
      inventoryByBrand,
    },
    recentSales,
    alerts: lowStockProducts,
  };
}

export async function getReportsData(filters: {
  startDate?: string;
  endDate?: string;
  brand?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters.startDate || filters.endDate) {
    where.soldAt = {};
    if (filters.startDate) (where.soldAt as Record<string, unknown>).gte = new Date(filters.startDate);
    if (filters.endDate) (where.soldAt as Record<string, unknown>).lte = new Date(filters.endDate);
  }

  const sales = await prisma.sale.findMany({
    where: {
      ...where,
      ...(filters.brand ? { product: { brand: filters.brand } } : {}),
    },
    include: { product: true },
    orderBy: { soldAt: "desc" },
  });

  const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const profit = sales.reduce(
    (sum, s) => sum + (s.salePrice - s.product.costPrice) * s.quantitySold,
    0
  );

  const productMap = new Map<
    string,
    { name: string; brand: string; totalSold: number; revenue: number; profit: number }
  >();
  for (const s of sales) {
    const existing = productMap.get(s.productId);
    const saleProfit = (s.salePrice - s.product.costPrice) * s.quantitySold;
    if (existing) {
      existing.totalSold += s.quantitySold;
      existing.revenue += s.totalAmount;
      existing.profit += saleProfit;
    } else {
      productMap.set(s.productId, {
        name: s.product.name,
        brand: s.product.brand,
        totalSold: s.quantitySold,
        revenue: s.totalAmount,
        profit: saleProfit,
      });
    }
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Slow movers: products with zero or fewest sales in period
  const allProducts = await prisma.product.findMany({
    where: filters.brand ? { brand: filters.brand } : {},
  });
  const slowMovers = allProducts
    .map((p) => ({
      name: p.name,
      brand: p.brand,
      totalSold: productMap.get(p.id)?.totalSold ?? 0,
      quantity: p.quantity,
    }))
    .sort((a, b) => a.totalSold - b.totalSold)
    .slice(0, 10);

  const brands = await prisma.product.findMany({
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });

  return {
    revenue,
    profit,
    salesCount: sales.length,
    topProducts,
    slowMovers,
    brands: brands.map((b) => b.brand),
    sales,
  };
}
