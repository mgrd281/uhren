"use client";

import { useEffect, useState, createContext, useContext, type ReactNode } from "react";

interface StoreSettings {
  storeName: string;
  locale: string;
  currencyCode: string;
  rtlEnabled: boolean;
}

const defaults: StoreSettings = {
  storeName: "دار الساعات الفاخرة",
  locale: "ar",
  currencyCode: "AED",
  rtlEnabled: true,
};

const Ctx = createContext<StoreSettings>(defaults);
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaults);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings({ ...defaults, ...d }))
      .catch(() => {});
  }, []);

  return <Ctx.Provider value={settings}>{children}</Ctx.Provider>;
}
