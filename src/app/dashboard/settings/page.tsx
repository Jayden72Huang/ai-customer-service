"use client";

import { useEffect, useState } from "react";
import { Save, Copy, Check, Code } from "lucide-react";

interface SiteSettings {
  id: string;
  name: string;
  domain: string;
  api_key: string;
  settings: {
    ai_provider: string;
    widget_color: string;
    widget_position: string;
    welcome_message: string;
    escalation_email: string;
    escalation_phone?: string;
    auto_detect_language: boolean;
    max_messages_per_hour: number;
  };
}

export default function SettingsPage() {
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSite() {
      try {
        const res = await fetch("/api/sites");
        if (res.ok) {
          const data = await res.json();
          if (data.sites?.length > 0) {
            setSite(data.sites[0] as SiteSettings);
          }
        }
      } catch { /* ignore */ }
    }
    loadSite();
  }, []);

  function getWidgetUrl() {
    if (!site) return "";
    const baseUrl = site.domain
      ? `https://${site.domain.replace(/^https?:\/\//, "")}`
      : process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
    return `<script src="${baseUrl}/widget.js" data-api-key="${site.api_key}"></script>`;
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
    try {
      await fetch("/api/sites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: site.id,
          name: site.name,
          domain: site.domain,
          settings: site.settings,
        }),
      });
    } catch { /* ignore */ }
    setSaving(false);
  }

  function updateSettings(key: string, value: unknown) {
    if (!site) return;
    setSite({
      ...site,
      settings: { ...site.settings, [key]: value },
    });
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-foreground mb-6">Settings</h2>

      {/* Embed Code */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Embed Code</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Add this to your website to enable the AI chat widget.
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
        <h3 className="font-semibold text-foreground mb-4">Site Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Site Name</label>
            <input
              value={site?.name || ""}
              onChange={(e) => site && setSite({ ...site, name: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Domain</label>
            <input
              value={site?.domain || ""}
              onChange={(e) => site && setSite({ ...site, domain: e.target.value })}
              placeholder="example.com"
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* AI Settings */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">AI Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">AI Provider</label>
            <select
              value={site?.settings.ai_provider || "deepseek"}
              onChange={(e) => updateSettings("ai_provider", e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="deepseek">DeepSeek (Cost-effective)</option>
              <option value="anthropic">Claude (Higher quality)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Welcome Message</label>
            <input
              value={site?.settings.welcome_message || ""}
              onChange={(e) => updateSettings("welcome_message", e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Max Messages / Hour</label>
            <input
              type="number"
              value={site?.settings.max_messages_per_hour || 30}
              onChange={(e) => updateSettings("max_messages_per_hour", parseInt(e.target.value))}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* Widget Appearance */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">Widget Appearance</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={site?.settings.widget_color || "#2563eb"}
                onChange={(e) => updateSettings("widget_color", e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">
                {site?.settings.widget_color || "#2563eb"}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Position</label>
            <select
              value={site?.settings.widget_position || "bottom-right"}
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
        <h3 className="font-semibold text-foreground mb-4">Escalation Notifications</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Notification Email
            </label>
            <input
              type="email"
              value={site?.settings.escalation_email || ""}
              onChange={(e) => updateSettings("escalation_email", e.target.value)}
              placeholder="support@example.com"
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              You&apos;ll receive an email when AI escalates a conversation to human support.
            </p>
          </div>
        </div>
      </section>

      {/* Save */}
      <button
        onClick={saveSite}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
