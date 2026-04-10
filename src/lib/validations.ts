import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  brand: z.string().min(1, "العلامة التجارية مطلوبة"),
  model: z.string().min(1, "الموديل مطلوب"),
  sku: z.string().min(1, "رقم المنتج مطلوب"),
  category: z.string().min(1, "الفئة مطلوبة"),
  color: z.string().min(1, "اللون مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  costPrice: z.coerce.number().positive("سعر التكلفة يجب أن يكون أكبر من صفر"),
  salePriceExpected: z.coerce.number().positive("سعر البيع المتوقع يجب أن يكون أكبر من صفر"),
  quantity: z.coerce.number().int().min(0, "الكمية لا يمكن أن تكون سالبة"),
  lowStockThreshold: z.coerce.number().int().min(0).default(2),
  mainImage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const saleSchema = z.object({
  productId: z.string().min(1, "المنتج مطلوب"),
  quantitySold: z.coerce.number().int().positive("الكمية المباعة يجب أن تكون أكبر من صفر"),
  salePrice: z.coerce.number().positive("سعر البيع يجب أن يكون أكبر من صفر"),
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
