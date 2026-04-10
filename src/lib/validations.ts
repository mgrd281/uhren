import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Produktname ist erforderlich"),
  brand: z.string().min(1, "Marke ist erforderlich"),
  model: z.string().min(1, "Modell ist erforderlich"),
  sku: z.string().min(1, "Artikelnummer ist erforderlich"),
  category: z.string().min(1, "Kategorie ist erforderlich"),
  color: z.string().min(1, "Farbe ist erforderlich"),
  description: z.string().min(1, "Beschreibung ist erforderlich"),
  costPrice: z.coerce.number().positive("Einkaufspreis muss größer als Null sein"),
  salePriceExpected: z.coerce.number().positive("Verkaufspreis muss größer als Null sein"),
  quantity: z.coerce.number().int().min(0, "Menge darf nicht negativ sein"),
  lowStockThreshold: z.coerce.number().int().min(0).default(2),
  mainImage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const saleSchema = z.object({
  productId: z.string().min(1, "Produkt ist erforderlich"),
  quantitySold: z.coerce.number().int().positive("Verkaufsmenge muss größer als Null sein"),
  salePrice: z.coerce.number().positive("Verkaufspreis muss größer als Null sein"),
  customerName: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
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
