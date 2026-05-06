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
} from "lucide-react";
import { cn } from "@/lib/utils";

import { SiteContext } from "@/components/site-context";

import type { MembershipTier } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/dashboard/insights", label: "Insights", icon: Lightbulb },
  { href: "/dashboard/seo", label: "SEO Articles", icon: FileText, premium: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
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
        // Get membership from session
        const userMembership = (session?.user as Record<string, unknown> | undefined)?.membership;
        if (userMembership) {
          setMembership(userMembership as MembershipTier);
        }
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSite();
  }, []);

  return (
    <SiteContext.Provider value={{ siteId, hasSite, membership, refreshSite: loadSite }}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border">
            <h1 className="text-lg font-bold text-foreground">AI Customer Service</h1>
            <p className="text-xs text-muted-foreground mt-1">Management Console</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
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
                  <span className="flex-1">{item.label}</span>
                  {isPro && (
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">
                      PRO
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

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
                    {membership === "premium" ? "Premium" : "Free"}{hasSite ? " · Site active" : ""}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Top bar with "New AI Agent" button */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-border">
            <div>
              {!loading && !hasSite && (
                <div className="flex items-center gap-2 text-sm text-warning">
                  <Bot className="w-4 h-4" />
                  No AI agent configured yet
                </div>
              )}
              {!loading && hasSite && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="w-4 h-4 text-success" />
                  AI agent active
                </div>
              )}
            </div>
            <button
              onClick={() => router.push("/dashboard?setup=new")}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {hasSite ? "New AI Agent" : "Create AI Agent"}
            </button>
          </div>

          <div className="p-8">{children}</div>
        </main>
      </div>
    </SiteContext.Provider>
  );
}
