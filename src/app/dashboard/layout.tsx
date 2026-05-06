"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  MessageSquare,
  BookOpen,
  Lightbulb,
  Settings,
  LayoutDashboard,
  LogOut,
  User,
  Plus,
  Bot,
  FileText,
  Crown,
  Globe,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { SiteContext, createT } from "@/components/site-context";

import type { MembershipTier } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { getStoredLocale, setStoredLocale } from "@/lib/i18n";

const navKeys = [
  { href: "/dashboard", key: "nav.overview", icon: LayoutDashboard },
  { href: "/dashboard/conversations", key: "nav.conversations", icon: MessageSquare },
  { href: "/dashboard/knowledge", key: "nav.knowledge", icon: BookOpen },
  { href: "/dashboard/insights", key: "nav.insights", icon: Lightbulb },
  { href: "/dashboard/seo", key: "nav.seo", icon: FileText, premium: true },
  { href: "/dashboard/settings", key: "nav.settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [siteId, setSiteId] = useState<string>("");
  const [hasSite, setHasSite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<MembershipTier>("free");
  const [locale, setLocaleState] = useState<Locale>("en");

  const t = createT(locale);

  function handleSetLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
  }

  async function loadSite() {
    try {
      const res = await fetch("/api/sites");
      if (res.ok) {
        const data = await res.json();
        if (data.sites?.length > 0) {
          const site = data.sites[0];
          setSiteId(site.id);
          setHasSite(true);
          if (typeof window !== "undefined") {
            localStorage.setItem("current_site_id", site.id);
            localStorage.setItem("site_data", JSON.stringify(site));
          }
        } else {
          setHasSite(false);
        }
      }
    } catch {
      // ignore
    }
    // Get membership from API (more reliable than session)
    try {
      const mRes = await fetch("/api/user/membership");
      if (mRes.ok) {
        const mData = await mRes.json();
        setMembership(mData.membership || "free");
      }
    } catch {
      // fallback to session
      const userMembership = (session?.user as Record<string, unknown> | undefined)?.membership;
      if (userMembership) setMembership(userMembership as MembershipTier);
    }
    setLoading(false);
  }

  useEffect(() => {
    setLocaleState(getStoredLocale());
    loadSite();
  }, []);

  return (
    <SiteContext.Provider value={{ siteId, hasSite, membership, locale, setLocale: handleSetLocale, t, refreshSite: loadSite }}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border">
            <h1 className="text-lg font-bold text-foreground">{t("nav.title")}</h1>
            <p className="text-xs text-muted-foreground mt-1">{t("nav.subtitle")}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navKeys.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const isPro = "premium" in item && item.premium;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{t(item.key)}</span>
                  {isPro && (
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">
                      PRO
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Upgrade CTA for free users */}
          {membership === "free" && (
            <div className="px-4 pb-2">
              <button
                onClick={() => router.push("/dashboard/upgrade")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
              >
                <Zap className="w-4 h-4" />
                {t("membership.upgrade")}
              </button>
            </div>
          )}

          <div className="p-4 border-t border-border space-y-2">
            {session?.user && (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.user.name || session.user.email}
                    </p>
                    {membership === "premium" && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {t(membership === "premium" ? "membership.premium" : "membership.free")}
                    {hasSite ? ` · ${t("membership.site_active")}` : ""}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t("nav.signout")}
              </button>
              {/* Language toggle */}
              <button
                onClick={() => handleSetLocale(locale === "en" ? "zh" : "en")}
                className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={locale === "en" ? "切换到中文" : "Switch to English"}
              >
                <Globe className="w-3.5 h-3.5" />
                {t("lang.switch")}
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-border">
            <div>
              {!loading && !hasSite && (
                <div className="flex items-center gap-2 text-sm text-warning">
                  <Bot className="w-4 h-4" />
                  {t("topbar.no_agent")}
                </div>
              )}
              {!loading && hasSite && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="w-4 h-4 text-success" />
                  {t("topbar.agent_active")}
                </div>
              )}
            </div>
            <button
              onClick={() => router.push("/dashboard?setup=new")}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {hasSite ? t("topbar.new_agent") : t("topbar.create_agent")}
            </button>
          </div>

          <div className="p-8">{children}</div>
        </main>
      </div>
    </SiteContext.Provider>
  );
}
