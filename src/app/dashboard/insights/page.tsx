"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  X,
  Lightbulb,
  TrendingUp,
  Brain,
  FileText,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSite } from "@/components/site-context";

interface Suggestion {
  id: string;
  suggested_question: string;
  suggested_answer: string;
  frequency: number;
  status: string;
  created_at: string;
}

interface Stats {
  total_conversations: number;
  escalated: number;
  escalation_rate: string;
  total_messages: number;
  category_breakdown: Record<string, number>;
}

interface TopQuestion {
  question: string;
  count: number;
  well_answered: boolean;
}

interface CategoryAnalysis {
  category: string;
  count: number;
  trend: string;
  insight: string;
}

interface KnowledgeGap {
  topic: string;
  description: string;
  priority: string;
}

interface ImprovementSuggestion {
  title: string;
  description: string;
  impact: string;
}

interface AutoSuggestion {
  question: string;
  answer: string;
  reason: string;
}

interface Report {
  summary: string;
  top_questions: TopQuestion[];
  category_analysis: CategoryAnalysis[];
  escalation_analysis: {
    total: number;
    common_reasons: string[];
    recommendation: string;
  };
  knowledge_gaps: KnowledgeGap[];
  improvement_suggestions: ImprovementSuggestion[];
  sentiment_overview: {
    positive: number;
    neutral: number;
    negative: number;
    note: string;
  };
  auto_suggestions: AutoSuggestion[];
}

interface ReportMeta {
  site: string;
  period_days: number;
  interactions_analyzed: number;
  generated_at: string;
}

function getCurrentSiteId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("current_site_id") || "";
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/20 text-destructive",
  medium: "bg-warning/20 text-warning",
  low: "bg-muted text-muted-foreground",
};

const IMPACT_COLORS = PRIORITY_COLORS;

export default function InsightsPage() {
  const { t } = useSite();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Report state
  const [report, setReport] = useState<Report | null>(null);
  const [reportMeta, setReportMeta] = useState<ReportMeta | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDays, setReportDays] = useState(1);
  const [reportError, setReportError] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    top_questions: true,
    categories: true,
    escalation: true,
    gaps: true,
    improvements: true,
    sentiment: true,
    auto_suggestions: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/insights?site_id=${getCurrentSiteId()}`);
    if (res.ok) {
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setStats(data.stats);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  async function generateReport() {
    setReportLoading(true);
    setReportError("");
    try {
      const res = await fetch("/api/insights/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: getCurrentSiteId(), days: reportDays }),
      });
      const data = await res.json();
      if (res.ok && data.report) {
        setReport(data.report);
        setReportMeta(data.meta);
        // Refresh suggestions since report may have added new ones
        fetchInsights();
      } else {
        setReportError(data.message || data.error || "Failed to generate report");
      }
    } catch {
      setReportError("Failed to generate report");
    }
    setReportLoading(false);
  }

  async function handleSuggestion(id: string, action: "approve" | "reject") {
    await fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestion_id: id, action, site_id: getCurrentSiteId() }),
    });
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t("insights.loading")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">{t("insights.title")}</h2>
        <p className="text-muted-foreground mt-1">
          {t("insights.subtitle")}
        </p>
      </div>

      {/* Performance Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">{t("insights.escalation_rate")}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.escalation_rate}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.escalated} {t("insights.of_conversations").replace("{0}", String(stats.total_conversations))}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">{t("insights.ai_resolution")}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.total_conversations > 0
                ? (
                    ((stats.total_conversations - stats.escalated) /
                      stats.total_conversations) *
                    100
                  ).toFixed(0) + "%"
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("insights.ai_resolution_desc")}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-warning" />
              <span className="text-sm text-muted-foreground">{t("insights.pending")}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{suggestions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("insights.pending_desc")}
            </p>
          </div>
        </div>
      )}

      {/* Daily Report Generator */}
      <div className="bg-card border border-primary/30 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">{t("insights.report")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("insights.report_desc")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={reportDays}
              onChange={(e) => setReportDays(Number(e.target.value))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={1}>{t("insights.last_24h")}</option>
              <option value={3}>{t("insights.last_3d")}</option>
              <option value={7}>{t("insights.last_7d")}</option>
              <option value={30}>{t("insights.last_30d")}</option>
            </select>
            <button
              onClick={generateReport}
              disabled={reportLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {reportLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {reportLoading ? t("insights.analyzing") : t("insights.generate")}
            </button>
          </div>
        </div>

        {reportError && (
          <p className="text-sm text-destructive mt-2">{reportError}</p>
        )}

        {/* Report Display */}
        {report && reportMeta && (
          <div className="mt-6 space-y-4">
            {/* Report Header */}
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {reportMeta.site} · {reportMeta.interactions_analyzed} interactions analyzed ·{" "}
                  {new Date(reportMeta.generated_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-foreground">{report.summary}</p>
            </div>

            {/* Sentiment Overview */}
            {report.sentiment_overview && (
              <div className="bg-background border border-border rounded-lg p-4">
                <button
                  onClick={() => toggleSection("sentiment")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-sm text-foreground">{t("insights.sentiment")}</span>
                  {expandedSections.sentiment ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {expandedSections.sentiment && (
                  <div className="mt-3">
                    <div className="flex gap-4 mb-2">
                      <span className="text-sm">
                        <span className="text-success font-medium">
                          {report.sentiment_overview.positive}
                        </span>{" "}
                        {t("insights.positive")}
                      </span>
                      <span className="text-sm">
                        <span className="text-muted-foreground font-medium">
                          {report.sentiment_overview.neutral}
                        </span>{" "}
                        {t("insights.neutral")}
                      </span>
                      <span className="text-sm">
                        <span className="text-destructive font-medium">
                          {report.sentiment_overview.negative}
                        </span>{" "}
                        {t("insights.negative")}
                      </span>
                    </div>
                    {/* Sentiment bar */}
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                      {(() => {
                        const total =
                          report.sentiment_overview.positive +
                          report.sentiment_overview.neutral +
                          report.sentiment_overview.negative;
                        if (total === 0) return null;
                        return (
                          <>
                            <div
                              className="bg-success"
                              style={{
                                width: `${(report.sentiment_overview.positive / total) * 100}%`,
                              }}
                            />
                            <div
                              className="bg-muted-foreground/30"
                              style={{
                                width: `${(report.sentiment_overview.neutral / total) * 100}%`,
                              }}
                            />
                            <div
                              className="bg-destructive"
                              style={{
                                width: `${(report.sentiment_overview.negative / total) * 100}%`,
                              }}
                            />
                          </>
                        );
                      })()}
                    </div>
                    {report.sentiment_overview.note && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {report.sentiment_overview.note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Top Questions */}
            {report.top_questions?.length > 0 && (
              <div className="bg-background border border-border rounded-lg p-4">
                <button
                  onClick={() => toggleSection("top_questions")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-sm text-foreground">
                    {t("insights.top_questions")} ({report.top_questions.length})
                  </span>
                  {expandedSections.top_questions ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {expandedSections.top_questions && (
                  <div className="mt-3 space-y-2">
                    {report.top_questions.map((q, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs text-muted-foreground w-6">
                            #{i + 1}
                          </span>
                          <span className="text-sm text-foreground">{q.question}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-muted-foreground">
                            ~{q.count}x
                          </span>
                          {q.well_answered ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category Analysis */}
            {report.category_analysis?.length > 0 && (
              <div className="bg-background border border-border rounded-lg p-4">
                <button
                  onClick={() => toggleSection("categories")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-sm text-foreground">
                    {t("insights.category_analysis")}
                  </span>
                  {expandedSections.categories ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {expandedSections.categories && (
                  <div className="mt-3 space-y-2">
                    {report.category_analysis.map((c, i) => (
                      <div key={i} className="py-2 border-b border-border last:border-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-muted rounded-md text-xs capitalize">
                              {c.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {c.count} {t("insights.interactions")}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {c.trend === "up" && (
                              <ArrowUpRight className="w-3 h-3 text-warning" />
                            )}
                            {c.trend}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{c.insight}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Escalation Analysis */}
            {report.escalation_analysis && (
              <div className="bg-background border border-border rounded-lg p-4">
                <button
                  onClick={() => toggleSection("escalation")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-sm text-foreground">
                    {t("insights.escalation_analysis")}
                  </span>
                  {expandedSections.escalation ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {expandedSections.escalation && (
                  <div className="mt-3">
                    <p className="text-sm text-foreground mb-2">
                      {report.escalation_analysis.total} {t("insights.escalated_conversations")}
                    </p>
                    {report.escalation_analysis.common_reasons?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground mb-1">{t("insights.common_reasons")}</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {report.escalation_analysis.common_reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-primary mt-2">
                      {report.escalation_analysis.recommendation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Knowledge Gaps */}
            {report.knowledge_gaps?.length > 0 && (
              <div className="bg-background border border-border rounded-lg p-4">
                <button
                  onClick={() => toggleSection("gaps")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-sm text-foreground">
                    {t("insights.knowledge_gaps")} ({report.knowledge_gaps.length})
                  </span>
                  {expandedSections.gaps ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {expandedSections.gaps && (
                  <div className="mt-3 space-y-2">
                    {report.knowledge_gaps.map((g, i) => (
                      <div key={i} className="py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground">
                            {g.topic}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs ${
                              PRIORITY_COLORS[g.priority] || PRIORITY_COLORS.low
                            }`}
                          >
                            {g.priority}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{g.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Improvement Suggestions */}
            {report.improvement_suggestions?.length > 0 && (
              <div className="bg-background border border-border rounded-lg p-4">
                <button
                  onClick={() => toggleSection("improvements")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-sm text-foreground">
                    {t("insights.improvement_suggestions")}
                  </span>
                  {expandedSections.improvements ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {expandedSections.improvements && (
                  <div className="mt-3 space-y-2">
                    {report.improvement_suggestions.map((s, i) => (
                      <div key={i} className="py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground">
                            {s.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs ${
                              IMPACT_COLORS[s.impact] || IMPACT_COLORS.low
                            }`}
                          >
                            {s.impact} {t("insights.impact")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Auto-generated Q&A Suggestions */}
            {report.auto_suggestions?.length > 0 && (
              <div className="bg-background border border-primary/20 rounded-lg p-4">
                <button
                  onClick={() => toggleSection("auto_suggestions")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-sm text-foreground">
                    {t("insights.auto_suggestions")} ({report.auto_suggestions.length})
                  </span>
                  {expandedSections.auto_suggestions ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {expandedSections.auto_suggestions && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {t("insights.auto_suggestions_desc")}
                    </p>
                    {report.auto_suggestions.map((s, i) => (
                      <div key={i} className="py-2 border-b border-border last:border-0">
                        <p className="font-medium text-sm text-foreground">Q: {s.question}</p>
                        <p className="text-sm text-muted-foreground mt-1">A: {s.answer}</p>
                        <p className="text-xs text-primary/70 mt-1">Reason: {s.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Learning Suggestions */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{t("insights.learning_suggestions")}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("insights.learning_desc")}
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">
            {t("insights.no_suggestions")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-warning/20 text-warning rounded-md text-xs font-medium">
                      {t("insights.asked")} {s.frequency}x
                    </span>
                  </div>
                  <p className="font-medium text-foreground text-sm">
                    Q: {s.suggested_question}
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    A: {s.suggested_answer}
                  </p>
                </div>
                <div className="flex gap-1 ml-4">
                  <button
                    onClick={() => handleSuggestion(s.id, "approve")}
                    className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
                    title="Approve — add to knowledge base"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleSuggestion(s.id, "reject")}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Reject"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
