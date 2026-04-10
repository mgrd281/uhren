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
        note: "المخزون الأولي",
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
        note: diff > 0 ? "زيادة مخزون يدوية" : "تعديل مخزون يدوي",
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
  soldAt?: Date;
  notes?: string | null;
}) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: data.productId },
  });

  if (product.quantity < data.quantitySold) {
    throw new Error(
      `الكمية المتاحة (${product.quantity}) أقل من الكمية المطلوبة (${data.quantitySold})`
    );
  }

  const totalAmount = data.quantitySold * data.salePrice;

  const sale = await prisma.sale.create({
    data: {
      productId: data.productId,
      quantitySold: data.quantitySold,
      salePrice: data.salePrice,
      totalAmount,
      customerName: data.customerName,
      invoiceNumber: data.invoiceNumber,
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
      note: `بيع - فاتورة ${data.invoiceNumber ?? "بدون رقم"}`,
    },
  });

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
      month: d.toLocaleDateString("ar-AE", { month: "short", year: "numeric" }),
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
    },
    charts: {
      salesOverTime,
      topProducts,
      topBrands,
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
