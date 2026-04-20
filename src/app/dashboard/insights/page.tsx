"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, Lightbulb, TrendingUp, Brain } from "lucide-react";

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

function getCurrentSiteId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("current_site_id") || "";
}

export default function InsightsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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
        <p className="text-muted-foreground">Loading insights...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">AI Insights</h2>
        <p className="text-muted-foreground mt-1">
          Review learning suggestions and performance metrics
        </p>
      </div>

      {/* Performance Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Escalation Rate</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.escalation_rate}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.escalated} of {stats.total_conversations} conversations
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">AI Resolution</span>
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
              Handled without human intervention
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-warning" />
              <span className="text-sm text-muted-foreground">Pending Suggestions</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{suggestions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Waiting for your review
            </p>
          </div>
        </div>
      )}

      {/* Learning Suggestions */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Learning Suggestions</h3>
        <p className="text-sm text-muted-foreground mt-1">
          These are auto-generated from frequently asked questions. Approve to add to your knowledge base.
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">
            No pending suggestions. Your AI is learning from conversations and will suggest new knowledge entries when patterns emerge.
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
                      Asked {s.frequency}x
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
