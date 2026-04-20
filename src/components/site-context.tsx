"use client";

import { createContext, useContext } from "react";

interface SiteContextType {
  siteId: string;
  hasSite: boolean;
  refreshSite: () => Promise<void>;
}

export const SiteContext = createContext<SiteContextType>({
  siteId: "",
  hasSite: false,
  refreshSite: async () => {},
});

export function useSite() {
  return useContext(SiteContext);
}
