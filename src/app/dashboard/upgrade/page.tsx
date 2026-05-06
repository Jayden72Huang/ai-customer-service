"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Check,
  Zap,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useSite } from "@/components/site-context";

export default function UpgradePage() {
  const { membership, t, refreshSite } = useSite();
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/user/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upgrade" }),
      });
      if (res.ok) {
        await refreshSite();
        router.push("/dashboard");
        // Force page reload to refresh session
        window.location.href = "/dashboard";
      }
    } catch {
      // ignore
    }
    setUpgrading(false);
  }

  if (membership === "premium") {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("upgrade.already_premium")}
        </h2>
        <p className="text-muted-foreground mb-6">
          {membership === "premium" ? "You have access to all premium features." : ""}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 mx-auto px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("upgrade.back")}
        </button>
      </div>
    );
  }

  const freeFeatures = [
    t("upgrade.free.f1"),
    t("upgrade.free.f2"),
    t("upgrade.free.f3"),
    t("upgrade.free.f4"),
    t("upgrade.free.f5"),
  ];

  const premiumFeatures = [
    t("upgrade.pro.f1"),
    t("upgrade.pro.f2"),
    t("upgrade.pro.f3"),
    t("upgrade.pro.f4"),
    t("upgrade.pro.f5"),
    t("upgrade.pro.f6"),
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-foreground">{t("upgrade.title")}</h2>
        </div>
        <p className="text-muted-foreground">{t("upgrade.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">{t("upgrade.free_plan")}</h3>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-bold text-foreground">$0</span>
              <span className="text-muted-foreground text-sm">{t("upgrade.per_month")}</span>
            </div>
            <span className="inline-block mt-2 px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
              {t("upgrade.current")}
            </span>
          </div>
          <ul className="space-y-3">
            {freeFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium Plan */}
        <div className="bg-card border-2 border-amber-500/30 rounded-2xl p-6 relative">
          <div className="absolute -top-3 left-6 px-3 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
            RECOMMENDED
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{t("upgrade.premium_plan")}</h3>
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-bold text-foreground">$29</span>
              <span className="text-muted-foreground text-sm">{t("upgrade.per_month")}</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {premiumFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {upgrading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {upgrading ? "Upgrading..." : t("upgrade.cta")}
          </button>
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 mx-auto px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("upgrade.back")}
        </button>
      </div>
    </div>
  );
}
