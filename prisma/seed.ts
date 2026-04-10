import { PrismaClient, StockStatus, MovementType } from "@prisma/client";

const prisma = new PrismaClient();

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
      storeName: "Luxusuhren Verwaltung",
      locale: "de",
      currencyCode: "EUR",
      rtlEnabled: false,
    },
  });

  const products = [
    // ==================== Michael Kors (90 Stk) ====================
    { name: "Michael Kors MK6356", brand: "Michael Kors", model: "MK6356", sku: "MK6356", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 20, notes: "EAN: 4053858642355" },
    { name: "Michael Kors MK5739", brand: "Michael Kors", model: "MK5739", sku: "MK5739", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 6, notes: "EAN: 4051432748103" },
    { name: "Michael Kors MK5896", brand: "Michael Kors", model: "MK5896", sku: "MK5896", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 9, notes: "EAN: 4053858190078" },
    { name: "Michael Kors MK8286", brand: "Michael Kors", model: "MK8286", sku: "MK8286", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "EAN: 4051432748301" },
    { name: "Michael Kors MK8281", brand: "Michael Kors", model: "MK8281", sku: "MK8281", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 7, notes: "EAN: 4051432739415" },
    { name: "Michael Kors MK5354", brand: "Michael Kors", model: "MK5354", sku: "MK5354", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 8, notes: "EAN: 4048803954829" },
    { name: "Michael Kors MK3190", brand: "Michael Kors", model: "MK3190", sku: "MK3190", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 6, notes: "EAN: 4051432739149" },
    { name: "Michael Kors MK3178", brand: "Michael Kors", model: "MK3178", sku: "MK3178", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "EAN: 4051432591563" },
    { name: "Michael Kors MK5353", brand: "Michael Kors", model: "MK5353", sku: "MK5353", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "EAN: 4048803954812" },
    { name: "Michael Kors MK3203", brand: "Michael Kors", model: "MK3203", sku: "MK3203", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "EAN: 4051432904578" },
    { name: "Michael Kors MK8344", brand: "Michael Kors", model: "MK8344", sku: "MK8344", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 4053858190375" },
    { name: "Michael Kors MK5735", brand: "Michael Kors", model: "MK5735", sku: "MK5735", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 4051432739385" },
    { name: "Michael Kors MK8917", brand: "Michael Kors", model: "MK8917", sku: "MK8917", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 4064092086614" },
    { name: "Michael Kors MK5491", brand: "Michael Kors", model: "MK5491", sku: "MK5491", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 4051432287824" },
    { name: "Michael Kors MK3221", brand: "Michael Kors", model: "MK3221", sku: "MK3221", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 4053858026650" },
    { name: "Michael Kors MK6474", brand: "Michael Kors", model: "MK6474", sku: "MK6474", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 4053858822962" },
    { name: "Michael Kors MK3179", brand: "Michael Kors", model: "MK3179", sku: "MK3179", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 4051432591570" },
    { name: "Michael Kors MK4339", brand: "Michael Kors", model: "MK4339", sku: "MK4339", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 4013496283884" },
    { name: "Michael Kors MK3197", brand: "Michael Kors", model: "MK3197", sku: "MK3197", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 4051432748028" },
    { name: "Michael Kors MK5605", brand: "Michael Kors", model: "MK5605", sku: "MK5605", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 4051432546358" },
    { name: "Michael Kors MK3191", brand: "Michael Kors", model: "MK3191", sku: "MK3191", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 4051432739156" },
    { name: "Michael Kors MK8919", brand: "Michael Kors", model: "MK8919", sku: "MK8919", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 4064092086638" },
    { name: "Michael Kors MK3192", brand: "Michael Kors", model: "MK3192", sku: "MK3192", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 4051432739163" },
    { name: "Michael Kors MK5955", brand: "Michael Kors", model: "MK5955", sku: "MK5955", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 0796483100268 – ohne Etikett" },

    // ==================== BOSS (24 Stk) ====================
    { name: "BOSS 1513757", brand: "BOSS", model: "1513757", sku: "BOSS-1513757", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 4, notes: "EAN: 7613272355155" },
    { name: "BOSS 1513758", brand: "BOSS", model: "1513758", sku: "BOSS-1513758", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "EAN: 7613272355162" },
    { name: "BOSS 1513755", brand: "BOSS", model: "1513755", sku: "BOSS-1513755", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 7613272355131" },
    { name: "BOSS 1513868", brand: "BOSS", model: "1513868", sku: "BOSS-1513868", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 7613272431507" },
    { name: "BOSS 1513712", brand: "BOSS", model: "1513712", sku: "BOSS-1513712", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 7613272354707" },
    { name: "BOSS 1513871", brand: "BOSS", model: "1513871", sku: "BOSS-1513871", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 7613272431538" },
    { name: "BOSS 1513720", brand: "BOSS", model: "1513720", sku: "BOSS-1513720", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 7613272354783" },
    { name: "BOSS 1513848", brand: "BOSS", model: "1513848", sku: "BOSS-1513848", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 7613272418508" },
    { name: "BOSS 1513907", brand: "BOSS", model: "1513907", sku: "BOSS-1513907", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 7613272442633" },
    { name: "BOSS 1513811", brand: "BOSS", model: "1513811", sku: "BOSS-1513811", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 7613272390682" },
    { name: "BOSS 1513838", brand: "BOSS", model: "1513838", sku: "BOSS-1513838", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 7613272416665" },
    { name: "BOSS 1513340", brand: "BOSS", model: "1513340", sku: "BOSS-1513340", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 7613272202244" },
    { name: "BOSS 1513930", brand: "BOSS", model: "1513930", sku: "BOSS-1513930", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 7613272467285" },
    { name: "BOSS 1513885", brand: "BOSS", model: "1513885", sku: "BOSS-1513885", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 7613272442411" },
    { name: "BOSS 1513908", brand: "BOSS", model: "1513908", sku: "BOSS-1513908", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 7613272442640" },
    { name: "BOSS 1513905", brand: "BOSS", model: "1513905", sku: "BOSS-1513905", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 7613272442619" },

    // ==================== Armani Exchange (1 Stk) ====================
    { name: "Armani Exchange AX2419", brand: "Armani Exchange", model: "AX2419", sku: "AX2419", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 4064092012057" },

    // ==================== Daniel Wellington (5 Stk) ====================
    { name: "Daniel Wellington DW00100127", brand: "Daniel Wellington", model: "DW00100127", sku: "DW00100127", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 169, quantity: 2, notes: "EAN: 7350068244568 – UVP 169,00 EUR" },
    { name: "Daniel Wellington DW00100306", brand: "Daniel Wellington", model: "DW00100306", sku: "DW00100306", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 165, quantity: 3, notes: "EAN: 7315030004915 – UVP 165,00 EUR" },

    // ==================== Maserati (2 Stk) ====================
    { name: "Maserati R8871621013", brand: "Maserati", model: "R8871621013", sku: "R8871621013", category: "Chronograph", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "EAN: 8033288893967" },

    // ==================== Diesel (6 Stk) ====================
    { name: "Diesel DZ4512", brand: "Diesel", model: "DZ4512", sku: "DZ4512", category: "Chronograph", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 4013496382365" },
    { name: "Diesel DZ7333", brand: "Diesel", model: "DZ7333", sku: "DZ7333", category: "Chronograph", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 4053858414495" },
    { name: "Diesel DZ4344", brand: "Diesel", model: "DZ4344", sku: "DZ4344", category: "Chronograph", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 4053858414419" },
    { name: "Diesel DZ7315", brand: "Diesel", model: "DZ7315", sku: "DZ7315", category: "Chronograph", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Diesel DZ7312", brand: "Diesel", model: "DZ7312", sku: "DZ7312", category: "Chronograph", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 4053858270848" },
    { name: "Diesel DZ4283", brand: "Diesel", model: "DZ4283", sku: "DZ4283", category: "Chronograph", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "EAN: 4051432896750" },

    // ==================== Emporio Armani ====================
    { name: "Emporio Armani AR11339", brand: "Emporio Armani", model: "AR11339", sku: "AR11339", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR11349", brand: "Emporio Armani", model: "AR11349", sku: "AR11349", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR2453", brand: "Emporio Armani", model: "AR2453", sku: "AR2453", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR60045", brand: "Emporio Armani", model: "AR60045", sku: "AR60045", category: "Automatik", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 5, notes: "" },
    { name: "Emporio Armani AR1410", brand: "Emporio Armani", model: "AR1410", sku: "AR1410", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR70002", brand: "Emporio Armani", model: "AR70002", sku: "AR70002", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },
    { name: "Emporio Armani AR60055", brand: "Emporio Armani", model: "AR60055", sku: "AR60055", category: "Automatik", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR11208", brand: "Emporio Armani", model: "AR11208", sku: "AR11208", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR11363", brand: "Emporio Armani", model: "AR11363", sku: "AR11363", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 13, notes: "" },
    { name: "Emporio Armani AR2434", brand: "Emporio Armani", model: "AR2434", sku: "AR2434", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },
    { name: "Emporio Armani AR11215", brand: "Emporio Armani", model: "AR11215", sku: "AR11215", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },
    { name: "Emporio Armani AR11471", brand: "Emporio Armani", model: "AR11471", sku: "AR11471", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },
    { name: "Emporio Armani AR11470", brand: "Emporio Armani", model: "AR11470", sku: "AR11470", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },
    { name: "Emporio Armani AR11457", brand: "Emporio Armani", model: "AR11457", sku: "AR11457", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR60032", brand: "Emporio Armani", model: "AR60032", sku: "AR60032", category: "Automatik", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 4, notes: "" },
    { name: "Emporio Armani AR11473", brand: "Emporio Armani", model: "AR11473", sku: "AR11473", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },
    { name: "Emporio Armani AR11341", brand: "Emporio Armani", model: "AR11341", sku: "AR11341", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },
    { name: "Emporio Armani AR0389", brand: "Emporio Armani", model: "AR0389", sku: "AR0389", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR11243", brand: "Emporio Armani", model: "AR11243", sku: "AR11243", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },
    { name: "Emporio Armani AR11360", brand: "Emporio Armani", model: "AR11360", sku: "AR11360", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR60053", brand: "Emporio Armani", model: "AR60053", sku: "AR60053", category: "Automatik", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR11165", brand: "Emporio Armani", model: "AR11165", sku: "AR11165", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR1451", brand: "Emporio Armani", model: "AR1451", sku: "AR1451", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 27, notes: "" },
    { name: "Emporio Armani AR60051", brand: "Emporio Armani", model: "AR60051", sku: "AR60051", category: "Automatik", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR2448", brand: "Emporio Armani", model: "AR2448", sku: "AR2448", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR60059", brand: "Emporio Armani", model: "AR60059", sku: "AR60059", category: "Automatik", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR11239", brand: "Emporio Armani", model: "AR11239", sku: "AR11239", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR11181", brand: "Emporio Armani", model: "AR11181", sku: "AR11181", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR11361", brand: "Emporio Armani", model: "AR11361", sku: "AR11361", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR11338", brand: "Emporio Armani", model: "AR11338", sku: "AR11338", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR11306", brand: "Emporio Armani", model: "AR11306", sku: "AR11306", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },
    { name: "Emporio Armani AR11241", brand: "Emporio Armani", model: "AR11241", sku: "AR11241", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },
    { name: "Emporio Armani AR11340", brand: "Emporio Armani", model: "AR11340", sku: "AR11340", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR11201", brand: "Emporio Armani", model: "AR11201", sku: "AR11201", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR11180", brand: "Emporio Armani", model: "AR11180", sku: "AR11180", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR11275", brand: "Emporio Armani", model: "AR11275", sku: "AR11275", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR2447", brand: "Emporio Armani", model: "AR2447", sku: "AR2447", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR60054", brand: "Emporio Armani", model: "AR60054", sku: "AR60054", category: "Automatik", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR5889", brand: "Emporio Armani", model: "AR5889", sku: "AR5889", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR1683", brand: "Emporio Armani", model: "AR1683", sku: "AR1683", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 12, notes: "" },
    { name: "Emporio Armani AR11355", brand: "Emporio Armani", model: "AR11355", sku: "AR11355", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 9, notes: "" },
    { name: "Emporio Armani AR1909", brand: "Emporio Armani", model: "AR1909", sku: "AR1909", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 5, notes: "" },
    { name: "Emporio Armani AR11401", brand: "Emporio Armani", model: "AR11401", sku: "AR11401", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR11245", brand: "Emporio Armani", model: "AR11245", sku: "AR11245", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 3, notes: "" },
    { name: "Emporio Armani AR11446", brand: "Emporio Armani", model: "AR11446", sku: "AR11446", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },
    { name: "Emporio Armani AR11059", brand: "Emporio Armani", model: "AR11059", sku: "AR11059", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR11128", brand: "Emporio Armani", model: "AR11128", sku: "AR11128", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR11091", brand: "Emporio Armani", model: "AR11091", sku: "AR11091", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Emporio Armani AR1908", brand: "Emporio Armani", model: "AR1908", sku: "AR1908", category: "Armbanduhr", color: "", description: "", costPrice: 0, salePriceExpected: 0, quantity: 2, notes: "" },

    // ==================== Zubehör ====================
    { name: "Nintendo Switch Controller", brand: "Sonstige", model: "Switch Controller", sku: "NINTENDO-SWITCH-CTRL", category: "Zubehör", color: "", description: "Nintendo Switch Controller", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
    { name: "Sony DualShock 4 Wireless Controller", brand: "Sonstige", model: "DualShock 4", sku: "SONY-DS4-CTRL", category: "Zubehör", color: "", description: "Sony DualShock 4 Wireless Controller", costPrice: 0, salePriceExpected: 0, quantity: 1, notes: "" },
  ];

  console.log(`Seeding ${products.length} products...`);

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
        status: statusFromQty(item.quantity),
        notes: item.notes || null,
        mainImage: null,
      },
    });

    if (item.quantity > 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: MovementType.ADD,
          quantity: item.quantity,
          note: "Anfangsbestand",
        },
      });
    }
  }

  console.log(`Done – ${products.length} Produkte angelegt.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
