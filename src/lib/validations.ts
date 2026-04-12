import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Produktname ist erforderlich"),
  brand: z.string().min(1, "Marke ist erforderlich"),
  model: z.string().min(1, "Modell ist erforderlich"),
  sku: z.string().min(1, "Artikelnummer ist erforderlich"),
  category: z.string().min(1, "Kategorie ist erforderlich"),
  color: z.string().default(""),
  description: z.string().default(""),
  costPrice: z.coerce.number().min(0, "Einkaufspreis darf nicht negativ sein"),
  salePriceExpected: z.coerce.number().min(0, "Verkaufspreis darf nicht negativ sein"),
  quantity: z.coerce.number().int().min(0, "Menge darf nicht negativ sein"),
  lowStockThreshold: z.coerce.number().int().min(0).default(2),
  mainImage: z.string().optional().nullable(),
  ebayStatus: z.string().default("Nicht gepostet"),
  shopifyStatus: z.string().default("Nicht gepostet"),
  notes: z.string().optional().nullable(),
});

export const saleSchema = z.object({
  productId: z.string().min(1, "Produkt ist erforderlich"),
  quantitySold: z.coerce.number().int().positive("Verkaufsmenge muss größer als Null sein"),
  salePrice: z.coerce.number().min(0, "Verkaufspreis darf nicht negativ sein"),
  customerName: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  shippingCost: z.coerce.number().min(0).optional().default(0),
  soldAt: z.coerce.date().optional(),
  notes: z.string().optional().nullable(),
});

export const settingsSchema = z.object({
  storeName: z.string().min(1),
  locale: z.string().min(1),
  currencyCode: z.string().min(1),
  rtlEnabled: z.boolean(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
