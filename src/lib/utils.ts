import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "EUR") {
  const hasCents = value % 1 !== 0;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE").format(value);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function stockStatusLabel(status: string) {
  const map: Record<string, string> = {
    IN_STOCK: "Auf Lager",
    LOW_STOCK: "Niedriger Bestand",
    OUT_OF_STOCK: "Ausverkauft",
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
    ADD: "Hinzugefügt",
    SALE: "Verkauf",
    ADJUSTMENT: "Anpassung",
    SHIPPING: "Versand",
  };
  return map[type] ?? type;
}
