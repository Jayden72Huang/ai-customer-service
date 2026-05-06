"use client";

import { createContext, useContext } from "react";
import type { MembershipTier } from "@/lib/types";

interface SiteContextType {
  siteId: string;
  hasSite: boolean;
  membership: MembershipTier;
  refreshSite: () => Promise<void>;
}

export const SiteContext = createContext<SiteContextType>({
  siteId: "",
  hasSite: false,
  membership: "free",
  refreshSite: async () => {},
});

export function useSite() {
  return useContext(SiteContext);
}
