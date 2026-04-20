"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Check,
  Copy,
  Globe,
  Mail,
  Code,
} from "lucide-react";

interface Stats {
  total_conversations: number;
  escalated: number;
  escalation_rate: string;
  total_messages: number;
  category_breakdown: Record<string, number>;
}

interface Site {
  id: string;
  name: string;
  domain: string;
  api_key: string;
  settings: Record<string, unknown>;
}

type SetupStep = "create" | "knowledge" | "notification" | "embed";

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  // Onboarding state
  const [setupStep, setSetupStep] = useState<SetupStep>("create");
  const [newSite, setNewSite] = useState<Site | null>(null); // stores site during onboarding
  const [siteName, setSiteName] = useState("");
  const [domain, setDomain] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [welcomeMsg, setWelcomeMsg] = useState("Hi! How can I help you today?");
  const [aiProvider, setAiProvider] = useState("deepseek");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSite = useCallback(async () => {
    try {
      const res = await fetch("/api/sites");
      if (res.ok) {
        const data = await res.json();
        if (data.sites?.length > 0) {
          setSite(data.sites[0]);
          // Fetch stats
          const statsRes = await fetch(`/api/insights?site_id=${data.sites[0].id}`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData.stats);
          }
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSite();
  }, [fetchSite]);

  async function createSite() {
    setCreating(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: siteName,
          domain: domain || null,
          settings: {
            ai_provider: aiProvider,
            widget_color: color,
            widget_position: "bottom-right",
            welcome_message: welcomeMsg,
            escalation_email: email,
            auto_detect_language: true,
            max_messages_per_hour: 30,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewSite(data.site);
        if (typeof window !== "undefined") {
          localStorage.setItem("current_site_id", data.site.id);
        }
        setSetupStep("knowledge");
      }
    } catch { /* ignore */ }
    setCreating(false);
  }

  async function copyEmbed() {
    const s = site || newSite;
    if (!s) return;
    const baseUrl = s.domain
      ? `https://${s.domain.replace(/^https?:\/\//, "")}`
      : process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const code = `<script src="${baseUrl}/widget.js" data-api-key="${s.api_key}"></script>`;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // ===== NO SITE or IN ONBOARDING: Show Setup =====
  if (!site || newSite) {
    const activeSite = newSite; // non-null after step 1
    const steps: { id: SetupStep; label: string; icon: React.ElementType }[] = [
      { id: "create", label: "Create Site", icon: Globe },
      { id: "knowledge", label: "Knowledge", icon: BookOpen },
      { id: "notification", label: "Notifications", icon: Mail },
      { id: "embed", label: "Go Live", icon: Code },
    ];
    const currentIdx = steps.findIndex((s) => s.id === setupStep);

    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Welcome! Let&apos;s set up your AI customer service</h2>
          <p className="text-muted-foreground mt-1">This takes about 2 minutes.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  isDone && "bg-success text-white",
                  isActive && "bg-primary text-white",
                  !isDone && !isActive && "bg-muted text-muted-foreground"
                )}>
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("w-8 h-0.5", isDone ? "bg-success" : "bg-muted")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Create Site */}
        {setupStep === "create" && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Site Details</h3>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Site Name *</label>
              <input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="My Company"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Domain (your website)</label>
              <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="www.example.com"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="text-xs text-muted-foreground mt-1">The embed code will use this domain</p>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">AI Model</label>
              <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="deepseek">DeepSeek (Cost-effective)</option>
                <option value="anthropic">Claude (Higher quality)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Theme Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <span className="text-xs text-muted-foreground">{color}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Welcome Message</label>
                <input value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Notification Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@example.com"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="text-xs text-muted-foreground mt-1">Receive alerts when AI escalates to human support</p>
            </div>
            <button onClick={createSite} disabled={!siteName || creating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {creating ? "Creating..." : "Create Site"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Knowledge */}
        {setupStep === "knowledge" && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Add Knowledge Base</h3>
            <p className="text-sm text-muted-foreground">Upload a CSV or paste a URL to your docs. You can also skip and add later.</p>
            <div className="bg-background border border-border border-dashed rounded-xl p-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">CSV format: question, answer, category</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors">
                Upload CSV
                <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  const siteId = activeSite?.id;
                  if (!file || !siteId) return;
                  const text = await file.text();
                  const lines = text.split("\n").filter((l) => l.trim());
                  const entries = [];
                  for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
                    if (parts.length >= 2) entries.push({ question: parts[0], answer: parts[1], category: parts[2] || "general" });
                  }
                  if (entries.length > 0) {
                    await fetch("/api/knowledge", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ site_id: siteId, entries }),
                    });
                    alert(`Imported ${entries.length} entries!`);
                  }
                }} />
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSetupStep("notification")}
                className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">
                Skip
              </button>
              <button onClick={() => setSetupStep("notification")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Notification */}
        {setupStep === "notification" && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Notification Settings</h3>
            <p className="text-sm text-muted-foreground">How should we reach you when AI needs human help?</p>
            {email ? (
              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg text-sm text-success">
                <Check className="w-4 h-4" />
                Notifications will be sent to: {email}
              </div>
            ) : (
              <div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@example.com"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}
            <button onClick={() => setSetupStep("embed")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 4: Embed */}
        {setupStep === "embed" && activeSite && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-semibold text-foreground text-center">You&apos;re all set!</h3>
            <p className="text-sm text-muted-foreground text-center">
              Add this code to your website to enable AI customer service.
            </p>
            <div className="relative">
              <pre className="bg-background border border-border rounded-lg p-4 text-xs text-foreground overflow-x-auto font-mono">
{`<script
  src="${activeSite.domain ? `https://${activeSite.domain.replace(/^https?:\/\//, "")}` : process.env.NEXT_PUBLIC_APP_URL || ""}/widget.js"
  data-api-key="${activeSite.api_key}"
></script>`}
              </pre>
              <button onClick={copyEmbed}
                className="absolute top-2 right-2 p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <button onClick={() => { setNewSite(null); fetchSite(); }}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===== HAS SITE: Show Dashboard =====
  const cards = [
    { label: "Total Conversations", value: stats?.total_conversations ?? "—", icon: MessageSquare, color: "text-primary" },
    { label: "Needs Human", value: stats?.escalated ?? "—", icon: AlertTriangle, color: "text-warning" },
    { label: "Escalation Rate", value: stats?.escalation_rate ?? "—", icon: TrendingUp, color: "text-success" },
    { label: "Total Messages", value: stats?.total_messages ?? "—", icon: BookOpen, color: "text-muted-foreground" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview of your AI customer service performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className={cn("w-5 h-5", card.color)} />
            </div>
            <p className="text-3xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {stats?.category_breakdown && Object.keys(stats.category_breakdown).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Question Categories</h3>
          <div className="space-y-3">
            {Object.entries(stats.category_breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => {
                const total = Object.values(stats.category_breakdown).reduce((a, b) => a + b, 0);
                const pct = ((count / total) * 100).toFixed(0);
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground capitalize">{category.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
