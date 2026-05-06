"use client";

import { createContext, useContext } from "react";
import type { MembershipTier } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

export interface SiteData {
  id: string;
  name: string;
  domain: string;
  api_key: string;
  settings: Record<string, unknown>;
}

interface SiteContextType {
  siteId: string;
  hasSite: boolean;
  sites: SiteData[];
  currentSite: SiteData | null;
  switchSite: (siteId: string) => void;
  membership: MembershipTier;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  refreshSite: () => Promise<void>;
}

export const SiteContext = createContext<SiteContextType>({
  siteId: "",
  hasSite: false,
  sites: [],
  currentSite: null,
  switchSite: () => {},
  membership: "free",
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
  refreshSite: async () => {},
});

export function useSite() {
  return useContext(SiteContext);
}

export function createT(locale: Locale) {
  return (key: string) => translations[locale]?.[key] || translations.en[key] || key;
}
