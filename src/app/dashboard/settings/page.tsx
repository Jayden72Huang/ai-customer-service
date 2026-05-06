"use client";

import { useEffect, useState } from "react";
import { Save, Copy, Check, Code, Plus, Trash2, Link2, Lock } from "lucide-react";
import { useSite } from "@/components/site-context";

interface QuickLink {
  label: string;
  url: string;
}

interface SiteSettingsObj {
  ai_provider: string;
  chat_style: string;
  widget_color: string;
  widget_position: string;
  welcome_message: string;
  escalation_email: string;
  escalation_phone?: string;
  auto_detect_language: boolean;
  max_messages_per_hour: number;
  quick_links?: QuickLink[];
}

interface SiteSettingsData {
  id: string;
  name: string;
  domain: string;
  api_key: string;
  settings: SiteSettingsObj;
}

export default function SettingsPage() {
  const { currentSite, siteId, membership, t } = useSite();
  const [site, setSite] = useState<SiteSettingsData | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);

  // Sync from context whenever the selected site changes
  useEffect(() => {
    if (currentSite) {
      setSite({
        id: currentSite.id,
        name: currentSite.name,
        domain: currentSite.domain,
        api_key: currentSite.api_key,
        settings: {
          ai_provider: (currentSite.settings.ai_provider as string) || "deepseek",
          chat_style: (currentSite.settings.chat_style as string) || "product",
          widget_color: (currentSite.settings.widget_color as string) || "#2563eb",
          widget_position: (currentSite.settings.widget_position as string) || "bottom-right",
          welcome_message: (currentSite.settings.welcome_message as string) || "",
          escalation_email: (currentSite.settings.escalation_email as string) || "",
          escalation_phone: currentSite.settings.escalation_phone as string | undefined,
          auto_detect_language: (currentSite.settings.auto_detect_language as boolean) ?? true,
          max_messages_per_hour: (currentSite.settings.max_messages_per_hour as number) || 30,
          quick_links: (currentSite.settings.quick_links as QuickLink[]) || [],
        },
      });
    } else {
      setSite(null);
    }
  }, [currentSite, siteId]);

  function getWidgetUrl() {
    if (!site) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `<script src="${origin}/widget.js" data-api-key="${site.api_key}"></script>`;
  }
  const embedCode = getWidgetUrl();

  async function copyCode() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveSite() {
    if (!site) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/sites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: site.id,
          name: site.name,
          domain: site.domain,
          settings: site.settings,
        }),
      });
      setSaveStatus(res.ok ? "success" : "error");
    } catch {
      setSaveStatus("error");
    }
    setSaving(false);
    setTimeout(() => setSaveStatus(null), 3000);
  }

  function updateSettings(key: string, value: unknown) {
    if (!site) return;
    setSite({
      ...site,
      settings: { ...site.settings, [key]: value },
    });
  }

  if (!site) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t("topbar.no_agent")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-foreground mb-1">{t("settings.title")}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {site.name}
      </p>

      {/* Embed Code */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t("settings.embed_code")}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {t("settings.embed_desc")}
        </p>
        <div className="relative">
          <pre className="bg-muted border border-border rounded-lg p-4 text-xs text-foreground overflow-x-auto font-mono">
            {embedCode || "Create a site to get your embed code"}
          </pre>
          {embedCode && (
            <button
              onClick={copyCode}
              className="absolute top-2 right-2 p-2 bg-card border border-border rounded-md hover:bg-muted transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      </section>

      {/* Site Settings */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">{t("settings.site_config")}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">{t("settings.site_name")}</label>
            <input
              value={site.name || ""}
              onChange={(e) => setSite({ ...site, name: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">{t("settings.domain")}</label>
            <input
              value={site.domain || ""}
              onChange={(e) => setSite({ ...site, domain: e.target.value })}
              placeholder="example.com"
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* AI Settings */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">{t("settings.ai_config")}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">{t("settings.ai_provider")}</label>
            <select
              value={site.settings.ai_provider || "deepseek"}
              onChange={(e) => updateSettings("ai_provider", e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="deepseek">DeepSeek (Cost-effective)</option>
              <option value="anthropic">Claude (Higher quality)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">{t("settings.chat_style")}</label>
            <select
              value={site.settings.chat_style || "product"}
              onChange={(e) => updateSettings("chat_style", e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="professional">🎯 Professional</option>
              <option value="product">🚀 Product Buddy</option>
              <option value="minimal">⚡ Minimal</option>
              <option value="warm">💛 Warm & Caring</option>
              <option value="playful">🎮 Playful</option>
              <option value="brand">🏷️ Brand Ambassador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">{t("settings.welcome_msg")}</label>
            <input
              value={site.settings.welcome_message || ""}
              onChange={(e) => updateSettings("welcome_message", e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">{t("settings.max_msg")}</label>
            <input
              type="number"
              value={site.settings.max_messages_per_hour || 30}
              onChange={(e) => updateSettings("max_messages_per_hour", parseInt(e.target.value))}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* Widget Appearance */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">{t("settings.widget")}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">{t("settings.theme_color")}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={site.settings.widget_color || "#2563eb"}
                onChange={(e) => updateSettings("widget_color", e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">
                {site.settings.widget_color || "#2563eb"}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">{t("settings.position")}</label>
            <select
              value={site.settings.widget_position || "bottom-right"}
              onChange={(e) => updateSettings("widget_position", e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>
        </div>
      </section>

      {/* Escalation Settings */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">{t("settings.escalation")}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">{t("settings.email")}</label>
            <input
              type="email"
              value={site.settings.escalation_email || ""}
              onChange={(e) => updateSettings("escalation_email", e.target.value)}
              placeholder="support@example.com"
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">{t("settings.email_desc")}</p>
          </div>
        </div>
      </section>

      {/* Quick Links (Premium) */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6 relative">
        {membership !== "premium" && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">{t("settings.premium_feature")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("settings.premium_links_desc")}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t("settings.quick_links")}</h3>
          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">PRO</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{t("settings.quick_links_desc")}</p>
        <div className="space-y-3">
          {(site.settings.quick_links || []).map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={link.label}
                onChange={(e) => {
                  const links = [...(site.settings.quick_links || [])];
                  links[i] = { ...links[i], label: e.target.value };
                  updateSettings("quick_links", links);
                }}
                placeholder="Label"
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={link.url}
                onChange={(e) => {
                  const links = [...(site.settings.quick_links || [])];
                  links[i] = { ...links[i], url: e.target.value };
                  updateSettings("quick_links", links);
                }}
                placeholder="https://..."
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => {
                  const links = (site.settings.quick_links || []).filter((_, j) => j !== i);
                  updateSettings("quick_links", links);
                }}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {(site.settings.quick_links || []).length < 5 && (
            <button
              onClick={() => {
                const links = [...(site.settings.quick_links || []), { label: "", url: "" }];
                updateSettings("quick_links", links);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("settings.add_link")}
            </button>
          )}
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={saveSite}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : t("settings.save")}
        </button>
        {saveStatus === "success" && (
          <span className="flex items-center gap-1.5 text-sm text-green-500 animate-in fade-in">
            <Check className="w-4 h-4" /> {t("settings.saved")}
          </span>
        )}
        {saveStatus === "error" && (
          <span className="text-sm text-red-500 animate-in fade-in">
            {t("settings.save_failed")}
          </span>
        )}
      </div>
    </div>
  );
}
