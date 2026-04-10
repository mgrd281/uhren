import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "AED") {
  return new Intl.NumberFormat("ar-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-AE").format(value);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("ar-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function stockStatusLabel(status: string) {
  const map: Record<string, string> = {
    IN_STOCK: "متوفر",
    LOW_STOCK: "مخزون منخفض",
    OUT_OF_STOCK: "نفد المخزون",
  };
  return map[status] ?? status;
}

export function stockStatusColor(status: string) {
  const map: Record<string, string> = {
    IN_STOCK: "text-emerald-600 bg-emerald-50",
    LOW_STOCK: "text-amber-600 bg-amber-50",
    OUT_OF_STOCK: "text-red-600 bg-red-50",
  };
  return map[status] ?? "text-zinc-500 bg-zinc-50";
}

export function movementTypeLabel(type: string) {
  const map: Record<string, string> = {
    ADD: "إضافة",
    SALE: "بيع",
    ADJUSTMENT: "تعديل",
  };
  return map[type] ?? type;
}
