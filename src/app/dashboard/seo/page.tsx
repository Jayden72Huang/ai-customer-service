"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Loader2,
  Trash2,
  Copy,
  Check,
  Lock,
  Crown,
} from "lucide-react";
import { useSite } from "@/components/site-context";

interface SeoArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  topics: string[];
  word_count: number;
  status: string;
  created_at: string;
}

function getCurrentSiteId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("current_site_id") || "";
}

export default function SeoPage() {
  const { membership, t, siteId: contextSiteId } = useSite();
  const [articles, setArticles] = useState<SeoArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genDays, setGenDays] = useState(7);
  const [selectedArticle, setSelectedArticle] = useState<SeoArticle | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const siteId = contextSiteId || getCurrentSiteId();
      const res = await fetch(`/api/seo?site_id=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [contextSiteId]);

  useEffect(() => {
    fetchArticles();
    setSelectedArticle(null);
  }, [fetchArticles]);

  async function generateArticle() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: contextSiteId || getCurrentSiteId(), days: genDays }),
      });
      const data = await res.json();
      if (res.ok && data.article) {
        fetchArticles();
        setSelectedArticle(data.article);
      } else {
        setError(data.error || "Failed to generate article");
      }
    } catch {
      setError("Failed to generate article");
    }
    setGenerating(false);
  }

  async function deleteArticle(id: string) {
    if (!confirm(t("seo.delete_confirm"))) return;
    await fetch(`/api/seo?id=${id}`, { method: "DELETE" });
    if (selectedArticle?.id === id) setSelectedArticle(null);
    fetchArticles();
  }

  async function copyContent(content: string) {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (membership !== "premium") {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Lock className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{t("seo.premium_feature")}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {t("seo.premium_gate_desc")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-bold text-foreground">{t("seo.title")}</h2>
          <Crown className="w-5 h-5 text-amber-400" />
        </div>
        <p className="text-muted-foreground text-sm">
          {t("seo.subtitle")}
        </p>
      </div>

      {/* Generator */}
      <div className="bg-card border border-primary/30 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{t("seo.generate")}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("seo.generate_desc")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={genDays}
              onChange={(e) => setGenDays(Number(e.target.value))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={7}>{t("seo.last_7d")}</option>
              <option value={14}>{t("seo.last_14d")}</option>
              <option value={30}>{t("seo.last_30d")}</option>
            </select>
            <button
              onClick={generateArticle}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {generating ? t("seo.generating") : t("seo.generate")}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Article List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {articles.length} {t("seo.articles")}
          </h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("seo.loading")}</p>
          ) : articles.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {t("seo.no_articles")}
              </p>
            </div>
          ) : (
            articles.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedArticle(a)}
                className={`w-full text-left bg-card border rounded-xl p-4 transition-colors ${
                  selectedArticle?.id === a.id
                    ? "border-primary"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <p className="font-medium text-foreground text-sm line-clamp-2">
                  {a.title}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{a.word_count} {t("seo.words")}</span>
                  <span>·</span>
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                {a.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.topics.slice(0, 3).map((topic, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Article Preview */}
        <div className="lg:col-span-2">
          {selectedArticle ? (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedArticle.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    /{selectedArticle.slug} · {selectedArticle.word_count} {t("seo.words")} ·{" "}
                    {new Date(selectedArticle.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyContent(selectedArticle.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs hover:bg-muted/80 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? t("seo.copied") : t("seo.copy_md")}
                  </button>
                  <button
                    onClick={() => deleteArticle(selectedArticle.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <pre className="bg-background border border-border rounded-lg p-4 text-xs text-foreground overflow-auto max-h-[600px] whitespace-pre-wrap font-mono">
                {selectedArticle.content}
              </pre>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                {t("seo.select_article")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
