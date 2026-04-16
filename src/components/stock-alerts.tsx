"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
const STORAGE_KEY = "stock-alerts-last";

export default function StockAlerts() {
  const checking = useRef(false);

  useEffect(() => {
    if (!("Notification" in window)) return;

    async function requestAndCheck() {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission !== "granted") return;
      checkStock();
    }

    async function checkStock() {
      if (checking.current) return;
      checking.current = true;

      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.kpis) return;

        const { lowStockItems, outOfStockItems } = data.kpis;
        const alerts = data.alerts as { name: string; brand: string; quantity: number; status: string }[];

        if (lowStockItems === 0 && outOfStockItems === 0) return;

        // Only notify once per unique state (avoid spam)
        const stateKey = `${lowStockItems}-${outOfStockItems}`;
        const last = localStorage.getItem(STORAGE_KEY);
        if (last === stateKey) return;
        localStorage.setItem(STORAGE_KEY, stateKey);

        // Build notification
        const outNames = alerts
          .filter((a) => a.status === "OUT_OF_STOCK")
          .map((a) => a.name)
          .slice(0, 3);
        const lowNames = alerts
          .filter((a) => a.status === "LOW_STOCK")
          .map((a) => `${a.name} (${a.quantity})`)
          .slice(0, 3);

        const lines: string[] = [];
        if (outOfStockItems > 0) {
          lines.push(`❌ ${outOfStockItems} ausverkauft: ${outNames.join(", ")}`);
        }
        if (lowStockItems > 0) {
          lines.push(`⚠️ ${lowStockItems} niedrig: ${lowNames.join(", ")}`);
        }

        new Notification("Bestandswarnung", {
          body: lines.join("\n"),
          icon: "/icon-192.png",
          tag: "stock-alert",
          renotify: true,
        });
      } catch {
        // silent
      } finally {
        checking.current = false;
      }
    }

    // Initial check after 5 seconds
    const timeout = setTimeout(requestAndCheck, 5000);
    // Periodic check
    const interval = setInterval(checkStock, CHECK_INTERVAL);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return null;
}
