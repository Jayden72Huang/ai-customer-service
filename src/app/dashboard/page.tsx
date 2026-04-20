"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Bot,
  ExternalLink,
  Settings,
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
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading...</p></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  // Onboarding state
  const [setupStep, setSetupStep] = useState<SetupStep>("create");
  const [newSite, setNewSite] = useState<Site | null>(null);
  const [siteName, setSiteName] = useState("");
  const [domain, setDomain] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [welcomeMsg, setWelcomeMsg] = useState("Hi! How can I help you today?");
  const [aiProvider, setAiProvider] = useState("deepseek");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch("/api/sites");
      if (res.ok) {
        const data = await res.json();
        const allSites = data.sites || [];
        setSites(allSites);
        if (allSites.length > 0) {
          setSite(allSites[0]);
          const statsRes = await fetch(`/api/insights?site_id=${allSites[0].id}`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData.stats);
          }
        } else {
          // No sites: auto-show setup
          setShowSetup(true);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Handle ?setup=new query param
  useEffect(() => {
    if (searchParams.get("setup") === "new") {
      setShowSetup(true);
      setSetupStep("create");
      setNewSite(null);
      setSiteName("");
      setDomain("");
      setEmail("");
      // Clean up URL
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

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

  // ===== SETUP MODE: Show Onboarding =====
  if (showSetup || newSite) {
    const activeSite = newSite;
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

        {/* Step 4: Install Guide */}
        {setupStep === "embed" && activeSite && (
          <InstallGuide site={activeSite} onCopy={copyEmbed} copied={copied} onDone={() => { setNewSite(null); setShowSetup(false); fetchSites(); }} />
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

      {/* Your AI Agents */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Your AI Agents</h3>
          <button
            onClick={() => { setShowSetup(true); setSetupStep("create"); setNewSite(null); setSiteName(""); setDomain(""); setEmail(""); }}
            className="text-xs text-primary hover:underline"
          >
            + Add New
          </button>
        </div>
        {sites.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground text-sm mb-4">No AI agents yet</p>
            <button
              onClick={() => { setShowSetup(true); setSetupStep("create"); }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Create Your First AI Agent
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.domain || "No domain configured"} · API Key: {s.api_key.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/dashboard/settings`}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </a>
                  {s.domain && (
                    <a
                      href={`https://${s.domain.replace(/^https?:\/\//, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      title="Visit site"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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

// ===== Install Guide Component =====
type InstallMethod = "nextjs" | "wordpress" | "shopify" | "html" | "gtm" | "claude-code" | null;

function InstallGuide({ site, onCopy, copied, onDone }: {
  site: Site;
  onCopy: () => void;
  copied: boolean;
  onDone: () => void;
}) {
  const [method, setMethod] = useState<InstallMethod>(null);
  const [verifyUrl, setVerifyUrl] = useState(site.domain || "");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; message: string } | null>(null);

  const widgetBase = site.domain
    ? `https://${site.domain.replace(/^https?:\/\//, "")}`
    : process.env.NEXT_PUBLIC_APP_URL || "https://ai-customer-service-neon.vercel.app";
  const scriptTag = `<script src="${widgetBase}/widget.js" data-api-key="${site.api_key}"></script>`;

  async function verifyInstall() {
    if (!verifyUrl) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const url = verifyUrl.startsWith("http") ? verifyUrl : `https://${verifyUrl}`;
      const res = await fetch("/api/verify-install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, api_key: site.api_key }),
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch {
      setVerifyResult({ ok: false, message: "Failed to check. Please verify manually." });
    }
    setVerifying(false);
  }

  const methods: { id: InstallMethod; label: string; desc: string; icon: string }[] = [
    { id: "claude-code", label: "Claude Code", desc: "One command auto-install", icon: "🤖" },
    { id: "gtm", label: "Google Tag Manager", desc: "No code changes", icon: "📊" },
    { id: "nextjs", label: "Next.js / React", desc: "Use next/script", icon: "⚛️" },
    { id: "wordpress", label: "WordPress", desc: "Edit theme footer", icon: "📝" },
    { id: "shopify", label: "Shopify", desc: "Edit theme.liquid", icon: "🛍️" },
    { id: "html", label: "HTML / Other", desc: "Paste before </body>", icon: "🌐" },
  ];

  const getSteps = (): string[] => {
    switch (method) {
      case "nextjs": return [
        "Open your root layout file (e.g. src/app/layout.tsx)",
        "Add this import at the top:\nimport Script from 'next/script'",
        "CODE:" + `<Script\n  src="${widgetBase}/widget.js"\n  data-api-key="${site.api_key}"\n  strategy="afterInteractive"\n/>`,
        "Add the above code inside <body>, save and deploy.",
      ];
      case "wordpress": return [
        "Go to Admin → Appearance → Theme File Editor",
        "Open footer.php",
        "CODE:" + scriptTag,
        "Paste the code right before </body> and click Update File.",
      ];
      case "shopify": return [
        "Go to Online Store → Themes → Edit Code",
        "Open theme.liquid, find </body>",
        "CODE:" + scriptTag,
        "Paste right before </body> and Save.",
      ];
      case "html": return [
        "Open your HTML file (e.g. index.html)",
        "Find the </body> tag",
        "CODE:" + scriptTag,
        "Paste right before </body>, upload to your server.",
      ];
      case "gtm": return [
        "Open Google Tag Manager → your container",
        "Click New Tag → Tag Type: Custom HTML",
        "CODE:" + scriptTag,
        "Set Trigger to All Pages → Page View, then Submit to publish.",
      ];
      case "claude-code": return [
        "Open your project in Claude Code (terminal or IDE)",
        "Paste this message to Claude:",
        "CODE:Please add an AI customer service chat widget to my website.\nAdd this script tag to my root layout or main HTML file, right before </body>:\n\n" + scriptTag + "\n\nDetect my framework and place it in the correct file.",
        "Claude will auto-detect your framework and install it.",
      ];
      default: return [];
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto">
        <Check className="w-6 h-6 text-success" />
      </div>
      <h3 className="font-semibold text-foreground text-center text-lg">Install AI Chat Widget</h3>
      <p className="text-sm text-muted-foreground text-center">
        Choose how you want to add the widget to your website
      </p>

      {!method ? (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className="flex items-start gap-3 p-4 bg-background border border-border rounded-lg text-left hover:border-primary/50 transition-colors"
            >
              <span className="text-xl">{m.icon}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button onClick={() => setMethod(null)} className="text-xs text-primary hover:underline">
            ← Choose different method
          </button>
          <ol className="space-y-3">
            {getSteps().map((step, i) => {
              if (step.startsWith("CODE:")) {
                const code = step.slice(5);
                return (
                  <li key={i} className="relative">
                    <pre className="bg-background border border-border rounded-lg p-4 text-xs text-foreground overflow-x-auto font-mono whitespace-pre-wrap">{code}</pre>
                    <button
                      onClick={() => { navigator.clipboard.writeText(code); onCopy(); }}
                      className="absolute top-2 right-2 p-1.5 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                  </li>
                );
              }
              return (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              );
            })}
          </ol>

          {/* Verification */}
          <div className="border-t border-border pt-4 mt-4">
            <h4 className="font-medium text-foreground text-sm mb-2">Verify Installation</h4>
            <p className="text-xs text-muted-foreground mb-3">Check if the widget is properly installed on your site</p>
            <div className="flex gap-2">
              <input
                value={verifyUrl}
                onChange={(e) => setVerifyUrl(e.target.value)}
                placeholder="example.com"
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={verifyInstall}
                disabled={verifying || !verifyUrl}
                className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                {verifying ? "Checking..." : "Verify"}
              </button>
            </div>
            {verifyResult && (
              <div className={cn(
                "flex items-center gap-2 mt-3 p-3 rounded-lg text-sm",
                verifyResult.ok ? "bg-success/10 text-success border border-success/20" : "bg-warning/10 text-warning border border-warning/20"
              )}>
                {verifyResult.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {verifyResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={onDone}
        className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
        Go to Dashboard
      </button>
    </div>
  );
}
